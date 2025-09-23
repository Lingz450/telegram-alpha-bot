"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limiterForChat = limiterForChat;
var bottleneck_1 = require("bottleneck");
var perChat = new Map();
function limiterForChat(chatId) {
    if (!perChat.has(chatId)) {
        perChat.set(chatId, new bottleneck_1.default({ minTime: 500 })); // 2 req/sec
    }
    return perChat.get(chatId);
}
