
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const GEMINI_2_5_PRO = 'gemini-2.5-pro';
export const GEMINI_2_5_FLASH = 'gemini-2.5-flash';
// export const GEMINI_2_5_IMAGE = 'gemini-2.5-flash-image-preview';
export const GEMINI_2_5_IMAGE = 'gemini-2.0-flash-preview-image-generation';
export const GEMINI_2_5_LITE = 'gemini-2.5-flash-lite-preview-09-2025';
export const GEMINI_3 = 'gemini-3-pro-preview';

export const GEMINI_MODELS = {
    GEMINI_2_5_FLASH: {
        id: GEMINI_2_5_FLASH,
        description: "A fast and capable model suitable for a wide range of tasks, including text generation, summarization, and more.",
        capabilities: [
            "Text Generation",
            "Summarization",
            "Conversational AI",
            "Content Creation",
            "Thinking",
            "Code Generation"
        ],
        limitations: [
            "May not handle highly complex or nuanced tasks as well as larger models",
            "Limited context window compared to larger models"
        ]
    },
    GEMINI_3: {
        id: GEMINI_3,
        description: "A model optimized for image-related tasks, including image generation, captioning, and understanding visual content. It works well for applications that require multimodal capabilities, and thinking so amazing. Recommended!!!",
        capabilities: [
            "Visual Content Analysis",
            "Multimodal Understanding",
            "Captioning",
            "Thinking",
            "Code Generation (so amazing!)",
            "Research"
        ],
        limitations: [
            "Not suitable for text-only tasks",
            "May have limitations in understanding complex visual scenes"
        ]
    },
    GEMINI_2_5_LITE: {
        id: GEMINI_2_5_LITE,
        description: "A balanced model that offers a good trade-off between performance and speed, suitable for a variety of applications.",
        capabilities: [
            "Text Generation",
            "Conversational AI",
            "Content Creation",
            "Thinking"
        ],
        limitations: [
            "May not be as fast as GEMINI_2_5_FLASH for certain tasks",
            "Limited context window compared to larger models"
        ]
    }
}
