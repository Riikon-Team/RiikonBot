/**
 * Tách tin nhắn thông minh
 */
const smartSplitMessage = (content, maxLength = 1800) => {
    if (content.length <= maxLength) {
        return [content];
    }

    const chunks = [];
    let currentChunk = '';
    
    // Tách theo các breakpoints tự nhiên
    const parts = parseContentParts(content);
    
    for (const part of parts) {
        const partContent = part.content;
        
        // Nếu thêm part này vào chunk hiện tại mà vượt quá maxLength
        if (currentChunk.length + partContent.length > maxLength) {
            // Lưu chunk hiện tại (nếu có nội dung)
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            
            // Xử lý part hiện tại
            if (partContent.length > maxLength) {
                // Chỉ tách nếu KHÔNG phải code block
                if (part.type === 'codeblock') {
                    // Code block quá dài nhưng KHÔNG được tách -> để nguyên
                    currentChunk = partContent;
                } else {
                    // Các type khác có thể tách
                    const subChunks = splitLargePart(part, maxLength);
                    // Thêm tất cả sub-chunks trừ cái cuối
                    for (let i = 0; i < subChunks.length - 1; i++) {
                        chunks.push(subChunks[i]);
                    }
                    // Cái cuối làm đầu cho chunk mới
                    currentChunk = subChunks[subChunks.length - 1] || '';
                }
            } else {
                currentChunk = partContent;
            }
        } else {
            currentChunk += partContent;
        }
    }
    
    // Thêm chunk cuối
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [content];
};

/**
 * Phân tích nội dung thành các parts - ưu tiên code blocks
 */
function parseContentParts(content) {
    const parts = [];
    let position = 0;
    
    // Bước 1: Tìm tất cả code blocks trước
    const codeBlocks = [];
    const codeBlockRegex = /```[\s\S]*?```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[0],
            type: 'codeblock'
        });
    }
    
    // Bước 2: Parse content với code blocks được bảo vệ
    while (position < content.length) {
        // Kiểm tra xem vị trí hiện tại có trong code block không
        const currentCodeBlock = codeBlocks.find(cb => 
            position >= cb.start && position < cb.end
        );
        
        if (currentCodeBlock) {
            // Nếu đang ở trong code block, thêm toàn bộ code block
            if (position === currentCodeBlock.start) {
                parts.push(currentCodeBlock);
            }
            position = currentCodeBlock.end;
        } else {
            // Tìm code block tiếp theo
            const nextCodeBlock = codeBlocks.find(cb => cb.start >= position);
            const endPosition = nextCodeBlock ? nextCodeBlock.start : content.length;
            
            if (endPosition > position) {
                const textContent = content.substring(position, endPosition);
                const textParts = parseTextContent(textContent, position);
                parts.push(...textParts);
            }
            
            position = endPosition;
        }
    }
    
    return parts;
}

/**
 * Parse text content (không có code blocks)
 */
function parseTextContent(text, startOffset = 0) {
    const parts = [];
    let position = 0;
    
    // Patterns cho text content (không bao gồm code blocks)
    const patterns = [
        // Bold headers
        {
            regex: /\*\*[^*\n]+\*\*:\s*/g,
            type: 'boldheader'
        },
        // Headers với dấu hai chấm
        {
            regex: /^[^:\n]+:\s*$/gm,
            type: 'header'
        },
        // Separators (dòng gạch ngang)
        {
            regex: /^-{3,}.*$/gm,
            type: 'separator'
        },
        // Inline code
        {
            regex: /`[^`\n]+`/g,
            type: 'inlinecode'
        },
        // List items (multi-line)
        {
            regex: /(?:^|\n)(\s*[-*+]\s+[^\n]+(?:\n(?!\s*[-*+]\s+|\n|\*\*)[^\n]*)*)/g,
            type: 'listitem'
        },
        // Double newlines (paragraph breaks)
        {
            regex: /\n\s*\n/g,
            type: 'paragraph_break'
        }
    ];
    
    while (position < text.length) {
        let closestMatch = null;
        let closestDistance = Infinity;
        
        // Tìm pattern gần nhất
        for (const pattern of patterns) {
            pattern.regex.lastIndex = 0;
            let match;
            
            while ((match = pattern.regex.exec(text)) !== null) {
                if (match.index >= position) {
                    const distance = match.index - position;
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestMatch = {
                            type: pattern.type,
                            content: match[0],
                            start: match.index + startOffset,
                            end: match.index + match[0].length + startOffset
                        };
                    }
                    break;
                }
            }
        }
        
        if (closestMatch) {
            // Thêm text trước match (nếu có)
            if (closestMatch.start - startOffset > position) {
                const beforeText = text.substring(position, closestMatch.start - startOffset);
                if (beforeText.trim()) {
                    parts.push({
                        type: 'text',
                        content: beforeText,
                        start: position + startOffset,
                        end: closestMatch.start
                    });
                }
            }
            
            // Thêm match
            parts.push(closestMatch);
            position = closestMatch.end - startOffset;
        } else {
            // Không có pattern nào, lấy phần còn lại
            const remaining = text.substring(position);
            if (remaining.trim()) {
                parts.push({
                    type: 'text',
                    content: remaining,
                    start: position + startOffset,
                    end: text.length + startOffset
                });
            }
            break;
        }
    }
    
    return parts;
}

/**
 * Tách part lớn thành các phần nhỏ hơn (KHÔNG tách code blocks)
 */
function splitLargePart(part, maxLength) {
    // KHÔNG BAO GIỜ tách code blocks
    if (part.type === 'codeblock') {
        return [part.content];
    }
    
    switch (part.type) {
        case 'paragraph':
        case 'text':
            return splitTextContent(part.content, maxLength);
        case 'listitem':
            return splitListItem(part.content, maxLength);
        case 'boldheader':
        case 'header':
            // Headers không nên tách
            return [part.content];
        default:
            return splitByWords(part.content, maxLength);
    }
}

/**
 * Tách text content
 */
function splitTextContent(text, maxLength) {
    // Tách theo câu trước
    const sentences = text.split(/(?<=[.!?:])\s+/);
    const chunks = [];
    let current = '';
    
    for (const sentence of sentences) {
        if (current.length + sentence.length > maxLength) {
            if (current.trim()) chunks.push(current.trim());
            
            if (sentence.length > maxLength) {
                // Câu quá dài, tách theo từ
                const words = splitByWords(sentence, maxLength);
                chunks.push(...words.slice(0, -1));
                current = words[words.length - 1] || '';
            } else {
                current = sentence;
            }
        } else {
            current += (current ? ' ' : '') + sentence;
        }
    }
    
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

/**
 * Tách list item
 */
function splitListItem(listContent, maxLength) {
    const lines = listContent.split('\n');
    const chunks = [];
    let current = '';
    
    for (const line of lines) {
        if (current.length + line.length + 1 > maxLength) {
            if (current.trim()) chunks.push(current.trim());
            current = line;
        } else {
            current += (current ? '\n' : '') + line;
        }
    }
    
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

/**
 * Tách theo từ
 */
function splitByWords(text, maxLength) {
    const words = text.split(' ');
    const chunks = [];
    let current = '';
    
    for (const word of words) {
        if (current.length + word.length + 1 > maxLength) {
            if (current.trim()) chunks.push(current.trim());
            current = word;
        } else {
            current += (current ? ' ' : '') + word;
        }
    }
    
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

export { smartSplitMessage };
export default smartSplitMessage;