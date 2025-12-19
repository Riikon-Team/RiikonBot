
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const GEMINI_MODELS = {
    GEMINI_FLASH_LASTEST: {
        id: 'gemini-flash-latest',
        description: "A fast and capable model suitable for a wide range of tasks, including text generation, summarization, and more. (memory 2024)",
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

    GEMINI_FLASH_LITE_LASTEST: {
        id: 'gemini-flash-latest',
        description: "A balanced model that offers a good trade-off between performance and speed, suitable for a variety of applications. (memory 2024)",
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
    },
    GEMINI_3_PRO: {
        id: 'gemini-3-pro-preview',
        description: "A model optimized for image-related tasks, including image generation, captioning, and understanding visual content. It works well for applications that require multimodal capabilities, and thinking so amazing. Recommended!!! (memory 2025)",
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
    GEMINI_3_FLASH: {
        id: 'gemini-3-flash-preview',
        description: "A model optimized for image-related tasks, including image generation, captioning, and understanding visual content. It works well for applications that require multimodal capabilities, and thinking so amazing. Recommended!!! (memory 2025)",
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
}
