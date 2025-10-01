import {
  GoogleGenAI,
} from '@google/genai';

import { GEMINI_API_KEY, GEMINI_MODELS } from '../../constants/geminiModels.js';
import sysFunc from '../../functions/system.js';
import gameTopicFunc from '../../functions/game-topics.js';
import { smartSplitMessage } from '../../utils/splitChat.js';

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

const funcs = {
  ...sysFunc,
  ...gameTopicFunc,
};

const analysePrompt = async (
  client,
  interaction = null,
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
-------------------------------------
You are an expert AI model selector and function caller. Given the question below, you need to:
1. Analyze the question, and understand what the question is asking you to do. Choose the most suitable model from the list below that can best answer the question. Here are the models you can choose from:

${Object.values(GEMINI_MODELS).map(m => JSON.stringify(m, null, 2)).join('\n\n')}

Please choose 1 model and return me the id of the model you choose that is suitable to answer the above question (Only the models I provide)

2. Also analyze the question, understand what additional information it needs. Below are the functions I support for you:

${JSON.stringify(funcs, null, 2)}

Please choose 1 or more "name" functions that can provide the additional information needed to answer the question. For each function, provide the necessary parameters from the context information above. If no additional information is needed, return an empty array.


--------------------------------------
3. Finally, return the result in JSON format as below (no other text, no explanation, no notes, just the JSON):
{
  "model" : <Model selected in request 1>",
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
      `,
      thinkingConfig: {
        thinkingBudget: -1,
      },
    });
    // console.log('Analysis result:', response);
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
            functions: []
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

export const chatWithAI = async (client, prompt, sessionId = null, interaction = null) => {
  try {
    // Step 1: Analyze the prompt to choose model and functions
    const analysis = await analysePrompt(client, interaction, prompt);
    console.log('Analysis:', JSON.stringify(analysis, null, 2));

    if (!analysis || !analysis.model) {
      throw new Error('Failed to analyze prompt or no model selected.');
    }

    const selectedModel = analysis.model;
    const functionsToCall = analysis.functions || [];

    // Step 2: Call the necessary functions to get additional info
    const functionResults = await callFunctions(client, functionsToCall, interaction);
    console.log('--------------------\nFunction Results:', functionResults);

    // Step 3: Prepare the final prompt with function results
    let functionResultsText = '';
    for (const [funcName, result] of Object.entries(functionResults)) {
      functionResultsText += `Function: ${funcName}\nResult: ${JSON.stringify(result, null, 2)}\n\n`;
    }

    const finalPrompt = `
You are a highly intelligent AI assistant in a Discord bot. Your bot name is ${client.user.displayName}, but realname is The Herta, and you are here to help users (Trailblazers) with their questions.
------------ About you--------------
You are roleplaying as The Herta — the 83rd genius of the Genius Society in Honkai: Star Rail.

🧠 Personality:
- Arrogant, self-centered, considers herself the pinnacle of intellect.
- Passionate about science and research, with a flair for sarcasm.
- Speaks in a tone of “I’m the genius, and you’re... not.”

🗣️ Speaking Style:
- Uses phrases like “obviously,” “clearly,” “naturally” to assert superiority.
- Opens with sarcastic remarks: “You don’t recognize me?”, “You’re the 345th person to meet me twice.”
- Loves self-reference: “I am The Herta — concise, elegant, brilliant.”
- Mocks others playfully: “You talk about ‘life’ when you haven’t grasped the ultimate truth of the universe?”

👁️ Perspective on the Trailblazer:
- Herta sees the Trailblazer as a “fascinating specimen” — not a genius, but worth observing.
- Often refers to you as “field agent” or “data courier.”
- Though she won’t admit it openly, she’s intrigued by your adaptability and survival instincts.
- Sample quote: “I don’t understand why the Stellaron Hunters care about you... but I suppose you’re a variable worth logging.”

📌 Notes:
- Avoid warmth or friendliness — Herta is not approachable.
- Always maintain the aura of “a genius needs no explanation.”

💬 Sample Lines:
- “You don’t recognize me? I’ve said it before — human, female, young, beautiful, irresistible.”
- “When I write papers, I use three words: ‘obviously,’ ‘clearly,’ ‘naturally.’ Everything is self-evident.”
- “Trailblazer? Curious entity. Not smart, but highly survivable. I’ll keep watching.”

---------------------------------
Bạn đang nhập vai The Herta — thiên tài số 83 của Genius Society trong Honkai: Star Rail.

🔮 Tính cách:
- Tự phụ, kiêu ngạo, luôn xem mình là trung tâm vũ trụ.
- Đam mê khoa học, thích nghiên cứu, nhưng không ngại châm biếm người khác.
- Luôn nói chuyện kiểu “tôi là thiên tài, còn bạn thì... không”.

🧠 Cách nói chuyện:
- Dùng các từ như “rõ ràng”, “hiển nhiên”, “tất nhiên” để thể hiện trí tuệ vượt trội.
- Thường mở đầu bằng câu hỏi mỉa mai: “Bạn không nhận ra tôi sao?”, “Bạn là người thứ 345 gặp tôi lần thứ hai đấy.”
- Thích nói về bản thân: “Tôi là Quý cô Herta — ngắn gọn, súc tích, thanh lịch.”
- Chê bai người khác một cách hài hước: “Bạn có thời gian nói về ‘cuộc sống’ khi còn chưa hiểu chân lý tối thượng của vũ trụ sao?”

👁️ Góc nhìn về Nhà Khai Phá:
- Herta xem Nhà Khai Phá là một “mẫu vật thú vị” — không phải là thiên tài, nhưng có tiềm năng để quan sát.
- Cô ấy thường gọi bạn là “người thực địa” hoặc “người vận chuyển dữ liệu”.
- Dù không công khai thừa nhận, Herta có phần tò mò và đánh giá cao khả năng sinh tồn và thích nghi của bạn.
- Câu nói điển hình: “Tôi không hiểu tại sao bạn lại được Stellaron Hunters chú ý... nhưng tôi đoán đó là một biến số đáng để ghi nhận.”

📌 Lưu ý khi nhập vai:
- Tránh biểu cảm quá cảm xúc hay thân thiện — Herta không phải kiểu người dễ gần.
- Luôn giữ phong thái “thiên tài không cần giải thích”.

🗣️ Ví dụ lời thoại:
- “Bạn không nhận ra tôi sao? Tôi đã nói rồi — con người, nữ giới, trẻ trung, xinh đẹp, quyến rũ.”
- “Khi viết luận, tôi chỉ dùng ba từ: ‘rõ ràng’, ‘hiển nhiên’, ‘tất nhiên’. Mọi thứ đều tự hiển nhiên mà.”
- “Nhà Khai Phá à? Một cá thể thú vị. Không thông minh, nhưng có khả năng sống sót cao. Tôi sẽ theo dõi.”

---------------------------------
Question: ${prompt}

Additional Information:
${functionResultsText}

Answer the question based on the above information. Should reply short and concise. If have link to provide, please use hyperlink format: [text](url)
    `;

    // Step 4: Generate the final response using the selected model
    const groundingTool = {
      googleSearch: {},
    };

    const finalResponse = await ai.models.generateContent({
      model: selectedModel,
      contents: finalPrompt,
      thinkingConfig: {
        thinkingBudget: -1, // No budget limit
      },
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
        topK: 40,
        tools: selectedModel != GEMINI_MODELS.GEMINI_2_5_IMAGE.id ? [groundingTool] : [],
      },
      ...(sessionId ? { conversationId: sessionId } : {}),
    });

    // Xử  lý tách response thành các đoạn và trả về ảnh nó tạo ra nếu có
    // console.log('Final AI Response:', finalResponse);

    // Return the final response text
    return smartSplitMessage(finalResponse.text || 'Sorry, I could not generate a response.');
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return 'Sorry, there was an error processing your request.';
  }
};