import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
  HarmCategory,
  HarmBlockThreshold,
  MediaResolution,
} from '@google/genai';


import { GEMINI_API_KEY, GEMINI_MODELS } from '../../constants/geminiModels.js';
import sysFunc from '../../functions/system.js';
import gameTopicFunc from '../../functions/game-topics.js';
import chatFunc from '../../functions/chat.js';
import { smartSplitMessage } from '../../utils/splitChat.js';
import { downloadImageAsBase64 } from '../../utils/downloadImage.js';
import { SYSTEM_INSTRUCTIONS } from '../../constants/ai.js';

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.OFF,
  },
]

const funcs = {
  ...chatFunc,
  ...sysFunc,
  ...gameTopicFunc,
};

const analysePrompt = async (
  client,
  interaction,
  prompt,
  model = GEMINI_MODELS.GEMINI_2_5_LITE.id,
) => {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `
Question: ${prompt}
-------------------------------------
Information from Discord request context, can be used to provide parameters to functions if needed:
- \`botName\`: ${client?.user?.username || 'N/A'}
- \`botId\`: ${client?.user?.id || 'N/A'}
- \`guildId\`: ${interaction?.guildId || 'N/A'}
- \`guildName\`: ${interaction?.guild?.name || 'N/A'}
- \`channelName\`: ${interaction?.channel?.name || 'N/A'}
- \`channelId\`: ${interaction?.channelId || 'N/A'}
- \`userId\`: ${interaction?.user?.id || interaction?.author?.id || 'N/A'}
- \`userName\`: ${interaction?.user?.username || interaction?.author?.username || 'N/A'}
- \`userTag\`: ${interaction?.user?.tag || interaction?.author?.tag || 'N/A'}
- \`userRoles\`: ${interaction?.member?.roles?.cache?.map(role => role.name).join(', ') || 'N/A'}
- \`userPermissions\`: ${interaction?.member?.permissions?.toArray().join(', ') || 'N/A'}
- \`isInVoiceChannel\`: ${interaction?.member?.voice?.channel ? 'true' : 'false'}
- \`voiceChannelId\`: ${interaction?.member?.voice?.channel?.id || 'N/A'}
- \`voiceChannelName\`: ${interaction?.member?.voice?.channel?.name || 'N/A'}
-------------------------------------
You are an expert AI model selector and function caller. Given the question below, you need to:
1. Analyze the question, and understand what the question is asking you to do. Choose the most suitable model from the list below that can best answer the question. Here are the models you can choose from:

${Object.values(GEMINI_MODELS).map(m => JSON.stringify(m, null, 2)).join('\n\n')}

Please choose 1 model and return me the id of the model you choose that is suitable to answer the above question (Only the models I provide)

2. Also analyze the question, understand what additional information it needs. Below are the functions I support for you:

${JSON.stringify(funcs, null, 2)}

Please choose 1 or more "name" functions that can provide the additional information needed to answer the question. ALWAY CALL 'GetChannelChatHistory'. For each function, provide the necessary parameters from the context information above. Each function can be called at more than once with different parameters if needed. If no additional information is needed, return an empty list of functions. You should only call functions that are relevant to the question. And you can call more than one function if needed, example GetChannelChatHistory to get previous chat history if the question is related to previous chat history or context and EditVoiceChannel to edit voice channel if the question is related to voice channel.


--------------------------------------
3. Finally, return the result in JSON format as below (no other text, no explanation, no notes, just the JSON):
{
  "model" : <Model selected in request 1>",
  "needLastAttachment": <true|false, whether the question need last message attachment as image input>,
  "functions": [
    {
      "name": "<Function name>", 
      "parameters": {
        "<param1>": "<value1>", 
        "<param2>": "<value2>"
      }
    }, 
  ...
  ]
}

--------------------------------------
Note: 
- Always call GetChannelChatHistory function if the question is related to previous chat history or context.
- If you don't know anything by a little information, you should GetChannelChatHistory function and needLastAttachment to true, so that the system can provide the last message attachment as image input.
- If user is asking about image content as described in the question, you should set "needLastAttachment" to true, so that the system can provide the last message attachment as image input.
      `,
      thinkingConfig: {
        thinkingBudget: -1,
      },
      config: {
        safetySettings: safetySettings,
      }
    });
    if (response.text && response.text.length > 0) {
      const text = response.text;

      try {
        const directParse = JSON.parse(text.trim());
        return directParse;
      } catch (firstError) {
        try {
          const jsonStart = text.indexOf('{');
          const jsonEnd = text.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = text.substring(jsonStart, jsonEnd + 1);
            const json = JSON.parse(jsonString);
            return json;
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return {
            model: "gemini-2.5-flash",
            functions: [],
            needLastAttachment: false
          };
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    throw error;
  }
}

const callFunctions = async (client, functions, interaction = null) => {
  const results = {};

  for (const func of functions) {
    const functionName = func.name;
    const params = func.parameters || {};

    if (funcs[functionName]) {
      try {
        const result = await funcs[functionName].execute(client, interaction, ...Object.values(params));
        results[functionName] = result;
      } catch (error) {
        console.error(`Error executing function ${functionName}:`, error);
        results[functionName] = null;
      }
    } else {
      console.warn(`Function ${functionName} not found.`);
      results[functionName] = null;
    }
  }
  return results;
}

export const chatWithAI = async (client, prompt, interaction = null) => {
  try {
    // Step 1: Analyze the prompt to choose model and functions
    const analysis = await analysePrompt(client, interaction, prompt);
    console.log(`Analysis Result: [${analysis?.model}, ${analysis?.functions.map(f => f.name).join(', ')}] `);

    if (!analysis || !analysis.model) {
      throw new Error('Failed to analyze prompt or no model selected.');
    }

    const selectedModel = analysis.model;
    const functionsToCall = analysis.functions || [];

    // Step 2: Call the necessary functions to get additional info
    const functionResults = await callFunctions(client, functionsToCall, interaction);
    // console.log('--------------------\nFunction Results:', functionResults);

    // Step 3: Prepare the final prompt with function results
    let functionResultsText = '';
    for (const [funcName, result] of Object.entries(functionResults)) {
      functionResultsText += `Function called: ${funcName}\nResult: ${JSON.stringify(result, null, 2)}\n\n`;
    }

    const basePrompt = `
_____ Info request _____
- \`Displayname's Author\`: ${interaction?.user?.displayName || interaction?.author?.globalName || 'N/A'} (Should use this name to talk to user)
- \`guildName\`: ${interaction?.guild?.name || 'N/A'}
- \`channelName\`: ${interaction?.channel?.name || 'N/A'}
- \`Username's Author\`: ${interaction?.user?.username || interaction?.author?.username || 'N/A'}
- \`Tag's Author\`: ${interaction?.user?.tag || interaction?.author?.tag || 'N/A'}
- \`isInVoiceChannel\`: ${interaction?.member?.voice?.channel ? 'true' : 'false'}
- \`voiceChannelName\`: ${interaction?.member?.voice?.channel?.name || 'N/A'}
_____ Question _____
Question: ${prompt}
_____ Additional Information _____
${functionResultsText}
---------------------------------
  `;
    // Step 4: Generate the final response using the selected model
    const contentParts = [{ text: basePrompt }];

    if (analysis.needLastAttachment) {
      const chatId = `${interaction.guild.id}-${interaction.channel.id}`;
      const lastAttachments = client.chatLastAttachments.get(chatId);

      if (lastAttachments && lastAttachments.length > 0) {
        console.log('Including last attachments in prompt:', lastAttachments.length, ' attachments');

        for (const attachment of lastAttachments) {
          try {
            const imageData = await downloadImageAsBase64(attachment.url);
            if (imageData) {
              contentParts.push({
                inlineData: {
                  mimeType: imageData.mimeType,
                  data: imageData.data,
                },
              });
            }
          } catch (error) {
            console.error('Failed to process attachment:', attachment.url, error);
          }
        }
      }
    }


    // Step 5: Generate the final response using the selected model
    const groundingTool = {
      googleSearch: {},
    };

    let chatSession = client.chatSessions.get(interaction?.channelId || 'default');
    if (!chatSession) {
      console.log('Creating new chat session for channel:', interaction?.channelId);
      chatSession = ai.chats.create({
        model: selectedModel,
        config: {
          safetySettings: safetySettings,
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          maxOutputTokens: 1024,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          tools: [groundingTool],
          thinkingConfig: {
            thinkingBudget: -1,
          },
          systemInstruction: await SYSTEM_INSTRUCTIONS({ clientDisplayName: client.user.displayName }),
        },
        history: [
          {
            role: 'user',
            parts: [{ text: 'Chào Saba! Tôi mới vào server này' }]
          },
          {
            role: 'model',
            parts: [{ text: 'Yoho..! 🐟 Chào mừng Kaniki mới! Tớ là Saba, cô gái cá chính hiệu sống ở ngọn hải đăng này! Bạn có mang theo vỏ sò nào không? Hay ít nhất là cà phê? 🦀' }]
          }
        ]
      });
      client.chatSessions.set(interaction?.channelId || 'default', chatSession);
    }

    const finalResponse = await chatSession.sendMessage({
      message: contentParts
    });

    const responseText = finalResponse.text || 'Sorry, I could not generate a response.';
    return smartSplitMessage(responseText);
  } catch (error) {
    console.error('❌ Error in chatWithAI:', error);
    if (error.message?.includes('quota')) {
      return ['Xin lỗi, hiện tại bot đã hết quota API. Hãy thử lại sau! 🐟'];
    }

    if (error.message?.includes('safety') || error.message?.includes('SAFETY')) {
      return ['Yoho..! 🐟 Tớ không thể trả lời câu hỏi này vì lý do an toàn. Hỏi tớ câu khác đi Kaniki!'];
    }

    if (error.message?.includes('RECITATION')) {
      return ['Ối! Câu hỏi này có vẻ giống nội dung đã có từ trước. Thử hỏi tớ cách khác đi! 🐟'];
    }

    return ['Ối! Có lỗi gì đó rồi... 🐟 Thuyền giấy của tớ bị lật mất rồi! Thử lại sau nhé Kaniki!'];
  }
};