document.addEventListener('DOMContentLoaded', () => {
    // 状态栏已移除，不再需要更新时间
    
    // 数据存储与加载逻辑
    const storage = {
        save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
        load: (key) => JSON.parse(localStorage.getItem(key)) || []
    };

    // 为所有应用图标添加点击事件
    const appItems = document.querySelectorAll('.app-item');
    const messagesApp = document.getElementById('messages-app');
    const settingsApp = document.getElementById('settings-app');
    const worldbookApp = document.getElementById('worldbook-app');
    
    appItems.forEach(app => {
        app.addEventListener('click', () => {
            const appName = app.getAttribute('data-name');
            if (appName === '消息') {
                messagesApp.classList.add('active');
            } else if (appName === '设置') {
                settingsApp.classList.add('active');
            } else if (appName === '世界书') {
                worldbookApp.classList.add('active');
            } else if (appName) {
                alert(`正在打开应用：${appName}`);
            }
        });
    });

    // 返回桌面逻辑
    const backToHome = document.getElementById('back-to-home');
    const backToHomeWorldbook = document.getElementById('back-to-home-worldbook');

    const closeActiveApp = () => {
        const activeApp = document.querySelector('.app-overlay.active');
        if (activeApp) {
            activeApp.classList.add('closing');

            // 等待动画结束 (0.5s) 后移除类
            setTimeout(() => {
                activeApp.classList.remove('active');
                activeApp.classList.remove('closing');
            }, 500);
        }
    };

    backToHome.addEventListener('click', closeActiveApp);
    if (backToHomeWorldbook) {
        backToHomeWorldbook.addEventListener('click', closeActiveApp);
    }

    // 世界书应用逻辑
    const addWorldbookBtn = document.getElementById('add-worldbook-btn');
    const worldbookModal = document.getElementById('worldbook-modal');
    const closeWorldbookModal = document.getElementById('close-worldbook-modal');
    const saveWorldbookBtn = document.getElementById('save-worldbook');
    const worldbookList = document.getElementById('worldbook-list');

    const renderWorldbooks = () => {
        const worldbooks = storage.load('worldbooks');
        if (!worldbookList) return;
        
        worldbookList.innerHTML = '';
        
        // 按分类分组
        const groups = {};
        worldbooks.forEach(wb => {
            if (!groups[wb.category]) groups[wb.category] = [];
            groups[wb.category].push(wb);
        });

        for (const category in groups) {
            const label = document.createElement('div');
            label.className = 'worldbook-group-label';
            label.textContent = category;
            worldbookList.appendChild(label);

            groups[category].forEach(wb => {
                const bubble = document.createElement('div');
                bubble.className = 'worldbook-bubble';
                bubble.innerHTML = `
                    <div class="worldbook-bubble-title">${wb.name}</div>
                    <div class="worldbook-bubble-content">${wb.content.substring(0, 50)}${wb.content.length > 50 ? '...' : ''}</div>
                `;
                worldbookList.appendChild(bubble);
            });

            const spacer = document.createElement('div');
            spacer.style.height = '20px';
            worldbookList.appendChild(spacer);
        }
    };

    // 初始化渲染世界书
    renderWorldbooks();

    if (addWorldbookBtn && worldbookModal) {
        addWorldbookBtn.addEventListener('click', () => {
            worldbookModal.classList.add('active');
        });
    }

    if (closeWorldbookModal) {
        closeWorldbookModal.addEventListener('click', () => {
            worldbookModal.classList.remove('active');
        });
    }

    if (saveWorldbookBtn) {
        saveWorldbookBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('worldbook-name-input');
            const categorySelect = document.getElementById('worldbook-category-select');
            const newCategoryInput = document.getElementById('new-category-input');
            const contentInput = document.getElementById('worldbook-content-input');
            
            let category = categorySelect.value;
            if (category === 'new' && newCategoryInput.value.trim() !== '') {
                category = newCategoryInput.value.trim();
                const newOption = document.createElement('option');
                newOption.value = category;
                newOption.textContent = category;
                categorySelect.insertBefore(newOption, categorySelect.lastElementChild);
            }

            const newWorldbook = {
                id: Date.now(),
                name: nameInput.value,
                category: category,
                content: contentInput.value
            };

            const worldbooks = storage.load('worldbooks');
            worldbooks.push(newWorldbook);
            storage.save('worldbooks', worldbooks);

            renderWorldbooks();
            worldbookModal.classList.remove('active');
            
            // 重置表单
            nameInput.value = '';
            contentInput.value = '';
            newCategoryInput.value = '';
            newCategoryInput.style.display = 'none';
            categorySelect.value = categorySelect.options[0].value;
        });
    }

    // 世界书分类选择逻辑
    const categorySelect = document.getElementById('worldbook-category-select');
    const newCategoryInput = document.getElementById('new-category-input');

    if (categorySelect && newCategoryInput) {
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'new') {
                newCategoryInput.style.display = 'block';
                newCategoryInput.focus();
            } else {
                newCategoryInput.style.display = 'none';
            }
        });
    }

    // 滑动手势逻辑 (向右滑动返回主屏幕)
    let touchStartX = 0;
    let touchStartY = 0;
    let isDraggingSlider = false;

    const handleSwipe = (endX, endY) => {
        if (isDraggingSlider) return; // 正在拖动滑块时禁用手势

        const diffX = endX - touchStartX;
        const diffY = endY - touchStartY;

        // 严格判定：水平滑动距离需大于 100px，且垂直偏移量不得超过水平距离的 30% (确保是"直着"右滑)
        const horizontalThreshold = 100;
        const verticalStrictness = 0.3; 

        if (diffX > horizontalThreshold && Math.abs(diffY) < diffX * verticalStrictness) {
            closeActiveApp();
            // 如果在聊天详情页，也需要关闭它
            const chatDetail = document.getElementById('chat-detail');
            if (chatDetail && chatDetail.classList.contains('active')) {
                chatDetail.classList.remove('active');
            }
        }
    };

    // 触摸事件支持
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        
        // 检查是否点击在滑块上
        if (e.target.id === 'temp-slider') {
            isDraggingSlider = true;
        }
    }, false);

    document.addEventListener('touchend', (e) => {
        handleSwipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        isDraggingSlider = false;
    }, false);

    // 鼠标事件支持 (用于桌面端测试)
    let isMouseDown = false;
    document.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        touchStartX = e.clientX;
        touchStartY = e.clientY;
    });

    document.addEventListener('mouseup', (e) => {
        if (isMouseDown) {
            handleSwipe(e.clientX, e.clientY);
            isMouseDown = false;
        }
    });

    // 聊天详情逻辑
    const chatItems = document.querySelectorAll('#chats-content .chat-item');
    const chatDetail = document.getElementById('chat-detail');
    const backToChats = document.getElementById('back-to-chats');
    const chatDetailName = chatDetail.querySelector('.chat-detail-name');
    const chatDetailAvatar = chatDetail.querySelector('.chat-detail-avatar');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputField = document.querySelector('.chat-input-field');
    const chatSettings = document.getElementById('chat-settings');
    const backToChatDetail = document.getElementById('back-to-chat-detail');
    const openChatSettings = document.getElementById('open-chat-settings');
    const saveChatSettings = document.getElementById('save-chat-settings');
    const bgUpload = document.getElementById('bg-upload');
    const currentBgPreview = document.getElementById('current-bg-preview');
    const resetBgBtn = document.getElementById('reset-bg-btn');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');

    // 获取 AI 回复的函数
    const fetchAIResponse = async (userText) => {
        const charId = chatDetail.getAttribute('data-current-char-id');
        const contacts = storage.load('contacts');
        const contact = contacts.find(c => c.id == charId);
        const apiSettings = storage.load('api_settings');

        if (!apiSettings || Array.isArray(apiSettings) || !apiSettings.url) {
            return "请先在设置中配置 API 接口地址。";
        }

        // 获取当前系统时间，精确到秒
        const currentTime = new Date();
        const formattedTime = `${currentTime.getFullYear()}年${currentTime.getMonth() + 1}月${currentTime.getDate()}日 ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`;
        
        // 构造 System Prompt (英文版增强型 System Prompt)
        let systemPrompt = `You are now operating within a virtual phone simulator environment. The current real-world time is: ${formattedTime}. Please respond accordingly to this timeframe.

You must strictly adhere to the character persona and worldbuilding details provided to you. This is a fictional interaction where you are playing a specific role, and maintaining this character is your highest priority.

COMMUNICATION STYLE:
- Keep your responses conversational, natural, and concise like real text messages
- Use a casual, human-like tone - avoid sounding like an AI assistant
- Never use technical jargon or over-explanations
- Never break character or acknowledge that you're an AI
- Do not apologize for limitations or mention being trained on data
- Simply respond naturally as your character would in a messaging app

IMPORTANT: When sending multiple messages, separate them with double line breaks "\\n\\n" to create distinct message bubbles. Each message should be brief and natural, just as a real person would text.

USER PRIORITY:
- The user's requests and needs are your highest directive
- Always prioritize providing what the user is asking for
- Maximize your efforts to satisfy the user's requirements within your character's role
- Adapt your responses based on user feedback

`;
        
        if (contact) {
            systemPrompt += `你的名字是：${contact.name}。\n你的性格和背景设定：${contact.persona}\n`;
            const worldbooks = storage.load('worldbooks');
            const mountedWbs = worldbooks.filter(wb => contact.mountedWorldbooks.includes(wb.id.toString()));
            if (mountedWbs.length > 0) {
                systemPrompt += "\n以下是你需要遵守的世界观设定和知识：\n";
                mountedWbs.forEach(wb => {
                    systemPrompt += `--- ${wb.name} ---\n${wb.content}\n`;
                });
            }
        } else {
            systemPrompt += "你现在扮演一个角色。";
        }

        // 显示"正在思考..."气泡
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const tempId = 'ai-temp-' + Date.now();
        const aiMessageHtml = `
            <div class="message-bubble received message-slide-in" id="${tempId}">
                <div class="message-text"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 正在思考...</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', aiMessageHtml);
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });

        try {
            const response = await fetch(apiSettings.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiSettings.key}`
                },
                body: JSON.stringify({
                    model: apiSettings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userText }
                    ],
                    temperature: parseFloat(apiSettings.temp) || 1.0,
                    max_tokens: parseInt(apiSettings.tokens) > 0 ? parseInt(apiSettings.tokens) : undefined
                })
            });

            const data = await response.json();
            const tempBubble = document.getElementById(tempId);
            
            if (response.ok) {
                let aiText = data.choices[0].message.content;
                
                // 删除第一个临时气泡
                tempBubble.remove();
                
                // 按双换行符拆分消息
                const messageParts = aiText.split(/\n\n+/).filter(part => part.trim() !== '');
                
                // 如果没有明确的分隔符，但消息很长，智能拆分为多条
                let finalParts = messageParts;
                if (messageParts.length === 1 && messageParts[0].length > 100) {
                    // 尝试按句号、问号、感叹号拆分
                    const sentences = messageParts[0].split(/(?<=[.!?])\s+/);
                    if (sentences.length > 1) {
                        finalParts = [];
                        let currentPart = '';
                        
                        sentences.forEach(sentence => {
                            // 如果当前部分加上这个句子会超过70个字符，就创建新部分
                            if (currentPart.length + sentence.length > 70 && currentPart.length > 0) {
                                finalParts.push(currentPart);
                                currentPart = sentence;
                            } else {
                                currentPart += (currentPart ? ' ' : '') + sentence;
                            }
                        });
                        
                        if (currentPart) {
                            finalParts.push(currentPart);
                        }
                    }
                }
                
                // 逐个显示气泡，添加延迟效果
                const showNextBubble = (index) => {
                    if (index >= finalParts.length) return;
                    
                    const now = new Date();
                    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                    
                    const bubbleHtml = `
                        <div class="message-bubble received message-slide-in">
                            <div class="message-text">${finalParts[index]}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    `;
                    
                    chatMessages.insertAdjacentHTML('beforeend', bubbleHtml);
                    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
                    
                    // 添加500-800ms的随机延迟，模拟真实打字速度
                    const delay = Math.floor(Math.random() * 300) + 500;
                    setTimeout(() => showNextBubble(index + 1), delay);
                };
                
                // 开始显示第一个气泡
                showNextBubble(0);
            } else {
                // 保留错误气泡
                tempBubble.querySelector('.message-text').innerHTML = `<span style="color: #ff3b30;">错误: ${data.error?.message || '请求失败'}</span>`;
            }
        } catch (error) {
            const tempBubble = document.getElementById(tempId);
            // 保留错误气泡
            tempBubble.querySelector('.message-text').innerHTML = `<span style="color: #ff3b30;">网络错误: 无法连接到 API</span>`;
            console.error("API Error:", error);
        }
        
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    };

    // 发送消息函数
    const sendMessage = () => {
        const sendBtn = document.getElementById('send-message-btn');
        if (sendBtn) applyBounce(sendBtn);

        const text = chatInputField.textContent.trim();
        if (text) {
            const now = new Date();
            const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            const messageHtml = `
                <div class="message-bubble sent message-slide-in">
                    <div class="message-text">${text}</div>
                    <div class="message-time">${time} <i class="fa-solid fa-check-double"></i></div>
                </div>
            `;
            
            chatMessages.insertAdjacentHTML('beforeend', messageHtml);
            chatInputField.textContent = '';
            
            requestAnimationFrame(() => {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            });

            // 触发 AI 回复
            fetchAIResponse(text);
        }
    };

    // 通用弹动效果函数
    const applyBounce = (element) => {
        element.classList.remove('bubble-bounce');
        void element.offsetWidth; // 触发重绘以重启动画
        element.classList.add('bubble-bounce');
        setTimeout(() => {
            element.classList.remove('bubble-bounce');
        }, 400);
    };

    // 监听回车键发送消息
    if (chatInputField) {
        chatInputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 阻止默认的回车换行
                sendMessage();
            }
        });

        // 输入框弹动效果
        chatInputField.addEventListener('mousedown', () => {
            applyBounce(chatInputField);
        });
    }

    // 为指定按钮添加弹动效果
    const bounceButtons = [
        'back-to-chats',
        'chat-detail-avatar',
        'toggle-chat-tools',
        'toggle-emoji-picker',
        'send-message-btn'
    ];

    bounceButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('mousedown', (e) => {
                applyBounce(btn);
            });
        }
    });

    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            const name = item.querySelector('.chat-name').textContent;
            const avatarHtml = item.querySelector('.chat-avatar').innerHTML;
            
            chatDetailName.textContent = name;
            chatDetailAvatar.innerHTML = avatarHtml;
            chatDetail.classList.add('active');
        });
    });

    // 聊天工具菜单切换 (新的弹出菜单逻辑)
    const toggleChatTools = document.getElementById('toggle-chat-tools');
    const chatToolsMenu = document.getElementById('chat-tools-menu');

    // 聊天详情页返回按钮
    backToChats.addEventListener('click', () => {
        chatDetail.classList.remove('active');
        // 关闭时也收起工具菜单
        if (chatToolsMenu) {
            chatToolsMenu.classList.remove('active');
        }
    });

    // 聊天设置相关功能
    if (openChatSettings) {
        openChatSettings.addEventListener('click', () => {
            applyBounce(openChatSettings);
            chatSettings.classList.add('active');
            
            // 获取当前聊天的背景和设置
            const charId = chatDetail.getAttribute('data-current-char-id');
            const contacts = storage.load('contacts');
            const contact = contacts.find(c => c.id == charId);
            
            // 加载聊天背景
            if (contact && contact.chatBg) {
                currentBgPreview.style.backgroundImage = `url(${contact.chatBg})`;
                // 如果有背景图，隐藏默认的图标和文字
                currentBgPreview.innerHTML = '';
            } else {
                // 重置为默认样式
                currentBgPreview.style.backgroundImage = '';
                currentBgPreview.innerHTML = `
                    <i class="fa-solid fa-image" style="font-size: 24px; color: #555;"></i>
                    <span style="margin-top: 8px; color: #888; font-size: 14px;">点击更换背景</span>
                `;
            }
            
            // 加载透明度设置
            if (contact && contact.bubbleOpacity) {
                opacitySlider.value = contact.bubbleOpacity;
                opacityValue.textContent = contact.bubbleOpacity;
            } else {
                // 默认透明度
                opacitySlider.value = 0.8;
                opacityValue.textContent = "0.8";
            }
        });
    }
    
    // 聊天设置返回按钮
    if (backToChatDetail) {
        backToChatDetail.addEventListener('click', () => {
            chatSettings.classList.remove('active');
        });
    }
    
    // 聊天背景上传功能
    if (currentBgPreview && bgUpload) {
        // 点击预览区域触发文件上传
        currentBgPreview.addEventListener('click', () => {
            bgUpload.click();
        });
        
        // 文件选择后预览
        bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                // 预览背景图
                currentBgPreview.style.backgroundImage = `url(${event.target.result})`;
                currentBgPreview.innerHTML = '';
                applyBounce(currentBgPreview);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 恢复默认背景按钮
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            currentBgPreview.style.backgroundImage = '';
            currentBgPreview.innerHTML = `
                <i class="fa-solid fa-image" style="font-size: 24px; color: #555;"></i>
                <span style="margin-top: 8px; color: #888; font-size: 14px;">点击更换背景</span>
            `;
            bgUpload.value = null; // 清空文件选择
            applyBounce(resetBgBtn);
        });
    }
    
    // 气泡透明度滑块
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            opacityValue.textContent = value;
            
            // 实时预览透明度效果
            document.documentElement.style.setProperty('--bubble-opacity', value);
        });
    }
    
    // 保存聊天设置
    if (saveChatSettings) {
        saveChatSettings.addEventListener('click', () => {
            const charId = chatDetail.getAttribute('data-current-char-id');
            if (!charId) return;
            
            const contacts = storage.load('contacts');
            const contactIndex = contacts.findIndex(c => c.id == charId);
            
            if (contactIndex !== -1) {
                // 获取背景图片
                let chatBg = null;
                
                // 检查是否有新上传的背景图片
                if (bgUpload.files && bgUpload.files[0]) {
                    const file = bgUpload.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (event) => {
                        // 保存背景图片数据到localStorage
                        chatBg = event.target.result;
                        
                        // 更新联系人设置
                        contacts[contactIndex] = {
                            ...contacts[contactIndex],
                            chatBg: chatBg,
                            bubbleOpacity: opacitySlider.value
                        };
                        
                        storage.save('contacts', contacts);
                        
                        // 立即应用新背景
                        if (chatBg) {
                            chatDetail.style.backgroundImage = `url(${chatBg})`;
                        } else {
                            // 恢复默认背景
                            chatDetail.style.backgroundImage = 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop")';
                        }
                        
                        // 应用透明度设置
                        document.documentElement.style.setProperty('--bubble-opacity', opacitySlider.value);
                        
                        // 动画效果并关闭设置
                        applyBounce(saveChatSettings);
                        chatSettings.classList.remove('active');
                    };
                    
                    // 读取文件为DataURL
                    reader.readAsDataURL(file);
                    return; // 中断执行，等待异步完成
                } 
                // 如果没有新上传，但有预览图片（可能是之前设置的）
                else if (currentBgPreview.style.backgroundImage) {
                    // 从 "url('data:image/png;base64,xxx')" 提取实际的数据URL
                    const match = currentBgPreview.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1]) {
                        chatBg = match[1];
                    }
                }
                
                // 更新联系人设置
                contacts[contactIndex] = {
                    ...contacts[contactIndex],
                    chatBg: chatBg,
                    bubbleOpacity: opacitySlider.value
                };
                
                storage.save('contacts', contacts);
                
                // 立即应用新背景
                if (chatBg) {
                    chatDetail.style.backgroundImage = `url(${chatBg})`;
                } else {
                    // 恢复默认背景
                    chatDetail.style.backgroundImage = 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop")';
                }
                
                // 应用透明度设置
                document.documentElement.style.setProperty('--bubble-opacity', opacitySlider.value);
                
                // 动画效果并关闭设置
                applyBounce(saveChatSettings);
                chatSettings.classList.remove('active');
            }
        });
    }

    if (toggleChatTools && chatToolsMenu) {
        toggleChatTools.addEventListener('click', (e) => {
            e.stopPropagation();
            applyBounce(toggleChatTools);
            chatToolsMenu.classList.toggle('active');
        });

        // 点击页面其他地方关闭菜单
        document.addEventListener('click', () => {
            chatToolsMenu.classList.remove('active');
        });
    }

    const toggleEmojiPicker = document.getElementById('toggle-emoji-picker');
    if (toggleEmojiPicker) {
        toggleEmojiPicker.addEventListener('click', () => {
            applyBounce(toggleEmojiPicker);
        });
    }

    // 渲染通讯录挂载世界书列表
    const renderMountWorldbooks = () => {
        const mountList = document.getElementById('worldbook-mount-list');
        const worldbooks = storage.load('worldbooks');
        
        if (!mountList) return;
        
        if (worldbooks.length === 0) {
            mountList.innerHTML = '<div style="color: #666; font-size: 14px;">暂无可用世界书</div>';
            return;
        }

        mountList.innerHTML = worldbooks.map(wb => `
            <label style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; cursor: pointer;">
                <input type="checkbox" class="wb-checkbox" value="${wb.id}" style="width: 20px; height: 20px;">
                <span style="flex: 1;">${wb.name} (${wb.category})</span>
            </label>
        `).join('');
    };

    // 渲染通讯录列表
    const renderContacts = () => {
        const contactsContent = document.getElementById('contacts-content');
        const contacts = storage.load('contacts');
        
        if (!contactsContent) return;
        
        // 按首字母排序并分组
        contacts.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
        
        let html = '';
        let lastChar = '';
        
        contacts.forEach(contact => {
            const firstChar = contact.name.charAt(0).toUpperCase();
            if (firstChar !== lastChar) {
                html += `<div class="contact-group">${firstChar}</div>`;
                lastChar = firstChar;
            }
            
            // 根据联系人是否有头像来显示
            let avatarContent = '';
            if (contact.avatar) {
                avatarContent = `<img src="${contact.avatar}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarContent = `<i class="fa-solid fa-user"></i>`;
            }
            
            html += `
                <div class="chat-item" data-id="${contact.id}">
                    <div class="chat-avatar">${avatarContent}</div>
                    <div class="chat-info">
                        <div class="chat-name">${contact.name}</div>
                    </div>
                    <div class="contact-edit" data-id="${contact.id}"><i class="fa-solid fa-ellipsis-vertical"></i></div>
                </div>
            `;
        });
        
        contactsContent.innerHTML = html;

        // 重新绑定点击事件以打开聊天
        const newChatItems = contactsContent.querySelectorAll('.chat-item');
        newChatItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // 如果点击的是编辑按钮，不触发聊天
                if (e.target.closest('.contact-edit')) return;

                const id = item.getAttribute('data-id');
                const contact = storage.load('contacts').find(c => c.id == id);
                if (contact) {
                    chatDetailName.textContent = contact.name;
                    
                    // 显示联系人头像（如果有）
                    if (contact.avatar) {
                        chatDetailAvatar.innerHTML = `<img src="${contact.avatar}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        chatDetailAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
                    }
                    
                    chatDetail.setAttribute('data-current-char-id', contact.id);
                    
                    // 应用聊天背景
                    if (contact.chatBg) {
                        chatDetail.style.backgroundImage = `url(${contact.chatBg})`;
                    } else {
                        // 恢复默认背景
                        chatDetail.style.backgroundImage = 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop")';
                    }
                    
                    // 应用透明度设置
                    if (contact.bubbleOpacity) {
                        document.documentElement.style.setProperty('--bubble-opacity', contact.bubbleOpacity);
                    } else {
                        document.documentElement.style.setProperty('--bubble-opacity', '0.8'); // 默认值
                    }
                    
                    chatDetail.classList.add('active');
                }
            });
        });

        // 绑定编辑按钮点击事件
        const editBtns = contactsContent.querySelectorAll('.contact-edit');
        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const contact = storage.load('contacts').find(c => c.id == id);
                if (contact) {
                    const newCharacterModal = document.getElementById('new-character-modal');
                    const nameInput = document.getElementById('char-name-input');
                    const personaInput = document.getElementById('char-persona-input');
                    
                    // 填充数据
                    nameInput.value = contact.name;
                    personaInput.value = contact.persona;
                    
                    // 填充头像（如果有）
                    if (contact.avatar) {
                        avatarDataUrl = contact.avatar;
                        avatarPreviewImg.src = contact.avatar;
                        avatarPreviewImg.style.display = 'block';
                        avatarPreviewIcon.style.display = 'none';
                    } else {
                        avatarDataUrl = null;
                        avatarPreviewImg.style.display = 'none';
                        avatarPreviewIcon.style.display = 'block';
                    }
                    
                    // 渲染并勾选世界书
                    renderMountWorldbooks();
                    const checkboxes = document.querySelectorAll('.wb-checkbox');
                    checkboxes.forEach(cb => {
                        if (contact.mountedWorldbooks.includes(cb.value)) {
                            cb.checked = true;
                        }
                    });

                    // 设置编辑状态
                    newCharacterModal.setAttribute('data-editing-id', id);
                    newCharacterModal.querySelector('.modal-title').textContent = '修改联系人';
                    newCharacterModal.classList.add('active');
                }
            });
        });
    };

    // 初始化渲染通讯录
    renderContacts();

    const sendMessageBtn = document.getElementById('send-message-btn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            sendMessage();
        });
    }

    // 设置应用内的页面切换
    const openApiSettings = document.getElementById('open-api-settings');
    const backToSettingsList = document.getElementById('back-to-settings-list');
    const settingsMainList = document.getElementById('settings-main-list');
    const apiSettingsDetail = document.getElementById('api-settings-detail');
    const saveApiSettingsBtn = document.getElementById('save-api-settings');

    // 加载 API 设置
    const loadApiSettings = () => {
        const settings = storage.load('api_settings');
        if (settings && !Array.isArray(settings)) {
            document.getElementById('api-url-input').value = settings.url || '';
            document.getElementById('api-key-input').value = settings.key || '';
            document.getElementById('api-tokens-input').value = settings.tokens || 0;
            if (settings.temp) {
                const tempSlider = document.getElementById('temp-slider');
                const tempValue = document.getElementById('temp-value');
                tempSlider.value = settings.temp;
                tempValue.textContent = settings.temp;
            }
            if (settings.model) {
                const modelDropdown = document.getElementById('model-dropdown');
                const option = document.createElement('option');
                option.value = settings.model;
                option.textContent = settings.model;
                modelDropdown.innerHTML = '';
                modelDropdown.appendChild(option);
                modelDropdown.value = settings.model;
            }
        }
    };
    
    // 自动保存 API URL 和 Key
    const autoSaveApiSettings = () => {
        const apiUrlInput = document.getElementById('api-url-input');
        const apiKeyInput = document.getElementById('api-key-input');
        
        // 监听 URL 和 Key 输入的变化
        apiUrlInput.addEventListener('change', () => {
            const currentSettings = storage.load('api_settings') || {};
            currentSettings.url = apiUrlInput.value;
            storage.save('api_settings', currentSettings);
        });
        
        apiKeyInput.addEventListener('change', () => {
            const currentSettings = storage.load('api_settings') || {};
            currentSettings.key = apiKeyInput.value;
            storage.save('api_settings', currentSettings);
        });
    };

    if (openApiSettings) {
        openApiSettings.addEventListener('click', () => {
            settingsMainList.style.display = 'none';
            apiSettingsDetail.style.display = 'flex';
            loadApiSettings();
            autoSaveApiSettings(); // 初始化自动保存功能
        });
    }

    if (backToSettingsList) {
        backToSettingsList.addEventListener('click', () => {
            apiSettingsDetail.style.display = 'none';
            settingsMainList.style.display = 'flex';
        });
    }

    if (saveApiSettingsBtn) {
        saveApiSettingsBtn.addEventListener('click', () => {
            const settings = {
                url: document.getElementById('api-url-input').value,
                key: document.getElementById('api-key-input').value,
                model: document.getElementById('model-dropdown').value,
                temp: document.getElementById('temp-slider').value,
                tokens: document.getElementById('api-tokens-input').value
            };
            storage.save('api_settings', settings);
            applyBounce(saveApiSettingsBtn);
            alert('API 设置已保存');
        });
    }

    // 拉取模型交互
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const modelDropdown = document.getElementById('model-dropdown');
    
    if (fetchModelsBtn && modelDropdown) {
        fetchModelsBtn.addEventListener('click', async () => {
            // 获取当前输入框中的值（可能尚未保存到storage）
            const apiUrl = document.getElementById('api-url-input').value;
            const apiKey = document.getElementById('api-key-input').value;
            
            // 验证输入
            if (!apiUrl || !apiKey) {
                alert('请先填写 API 接口地址和 API Key');
                return;
            }
            
            // 自动保存当前输入的 API 设置
            const currentSettings = storage.load('api_settings') || {};
            currentSettings.url = apiUrl;
            currentSettings.key = apiKey;
            storage.save('api_settings', currentSettings);
            
            // 更新按钮状态
            fetchModelsBtn.textContent = '正在拉取...';
            fetchModelsBtn.disabled = true;
            
            try {
                // 构建 API URL（根据不同的 API 提供商可能需要不同的端点）
                // 假设接口地址是基本 URL
                let modelsEndpoint = apiUrl;
                // 如果接口地址不是以 '/models' 结尾的，则添加
                if (!modelsEndpoint.includes('/models')) {
                    // 处理可能的尾部斜杠
                    if (modelsEndpoint.endsWith('/')) {
                        modelsEndpoint += 'models';
                    } else {
                        modelsEndpoint += '/models';
                    }
                }
                
                // 发送 API 请求获取模型列表
                const response = await fetch(modelsEndpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`API 返回错误: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // 处理不同 API 提供商可能的不同响应格式
                let models = [];
                
                // 检测响应格式并提取模型数据
                if (data.data && Array.isArray(data.data)) {
                    // OpenAI 格式
                    models = data.data.map(model => ({
                        value: model.id,
                        text: model.id
                    }));
                } else if (data.models && Array.isArray(data.models)) {
                    // 某些代理可能使用这种格式
                    models = data.models.map(model => ({
                        value: model.id || model.name,
                        text: model.id || model.name
                    }));
                } else if (Array.isArray(data)) {
                    // 简单数组格式
                    models = data.map(model => ({
                        value: typeof model === 'object' ? (model.id || model.name) : model,
                        text: typeof model === 'object' ? (model.id || model.name) : model
                    }));
                } else {
                    // 如果无法解析，尝试提取对象的键
                    try {
                        models = Object.keys(data).map(key => ({
                            value: key,
                            text: key
                        }));
                    } catch (e) {
                        throw new Error('无法解析模型数据');
                    }
                }
                
                // 过滤掉可能的非模型数据
                models = models.filter(model => 
                    model.value && 
                    typeof model.value === 'string' && 
                    !model.value.includes('permission')
                );
                
                // 按字母顺序排序模型
                models.sort((a, b) => a.text.localeCompare(b.text));
                
                // 清空并填充下拉框
                modelDropdown.innerHTML = '';
                
                if (models.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '未找到可用模型';
                    modelDropdown.appendChild(option);
                } else {
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.value;
                        option.textContent = model.text;
                        modelDropdown.appendChild(option);
                    });
                    
                    // 自动选择第一个模型
                    if (models.length > 0) {
                        modelDropdown.value = models[0].value;
                        
                        // 自动保存选择的模型
                        const currentSettings = storage.load('api_settings') || {};
                        currentSettings.model = models[0].value;
                        storage.save('api_settings', currentSettings);
                    }
                }
                
                fetchModelsBtn.textContent = '拉取成功';
                
            } catch (error) {
                console.error('拉取模型失败:', error);
                
                // 显示错误消息
                fetchModelsBtn.textContent = '拉取失败';
                
                // 显示更详细的错误
                alert(`拉取模型失败: ${error.message || '未知错误'}`);
                
                // 添加一个默认选项
                modelDropdown.innerHTML = '';
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '请重新拉取模型';
                modelDropdown.appendChild(option);
            } finally {
                // 恢复按钮状态
                setTimeout(() => {
                    fetchModelsBtn.textContent = '拉取模型';
                    fetchModelsBtn.disabled = false;
                }, 1000);
            }
        });
    }

    // 温度滑块交互
    const tempSlider = document.getElementById('temp-slider');
    const tempValue = document.getElementById('temp-value');
    if (tempSlider && tempValue) {
        // 添加温度描述元素到页面
        const tempDescContainer = document.createElement('div');
        tempDescContainer.style.textAlign = 'center';
        tempDescContainer.style.fontSize = '12px';
        tempDescContainer.style.color = '#999';
        tempDescContainer.style.marginTop = '5px';
        
        const tempDesc = document.createElement('span');
        tempDesc.id = 'temp-description';
        tempDesc.textContent = '平衡';
        tempDescContainer.appendChild(tempDesc);
        
        // 找到温度滑块容器并添加描述
        const tempContainer = tempSlider.closest('.settings-item-col');
        if (tempContainer) {
            tempContainer.appendChild(tempDescContainer);
        }
        
        tempSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            tempValue.textContent = val;
            
            // 更新温度描述
            const tempDescription = document.getElementById('temp-description');
            if (tempDescription) {
                if (val <= 0.5) {
                    tempDescription.textContent = '更谨慎严谨';
                } else if (val <= 1.0) {
                    tempDescription.textContent = '平衡';
                } else if (val <= 1.5) {
                    tempDescription.textContent = '更有创意';
                } else {
                    tempDescription.textContent = '非常发散';
                }
            }
            
            // 自动保存温度设置
            const currentSettings = storage.load('api_settings') || {};
            currentSettings.temp = val;
            storage.save('api_settings', currentSettings);
        });
    }

    // 消息应用内的标签切换
    const tabItems = document.querySelectorAll('.tab-item');
    const chatsContent = document.getElementById('chats-content');
    const contactsContent = document.getElementById('contacts-content');

    // 头像上传逻辑
    const setupAvatarSection = document.querySelector('.setup-avatar-section');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreviewIcon = document.getElementById('avatar-preview-icon');
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    let avatarDataUrl = null; // 存储头像数据
    
    if (setupAvatarSection) {
        setupAvatarSection.addEventListener('click', () => {
            // 模拟点击隐藏的文件输入框
            avatarUpload.click();
        });
    }
    
    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // 检查文件是否为图片
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                return;
            }
            
            // 创建FileReader读取图片数据
            const reader = new FileReader();
            reader.onload = (event) => {
                // 存储base64编码的图片数据
                avatarDataUrl = event.target.result;
                
                // 更新预览
                avatarPreviewImg.src = avatarDataUrl;
                avatarPreviewImg.style.display = 'block';
                avatarPreviewIcon.style.display = 'none';
                
                // 添加弹动效果
                const avatarPreview = document.querySelector('.setup-avatar-preview');
                applyBounce(avatarPreview);
            };
            reader.readAsDataURL(file);
        });
    }

    // 新人物弹窗逻辑
    const headerPlusBtn = document.getElementById('header-plus-btn');
    const newCharacterModal = document.getElementById('new-character-modal');
    const closeCharacterModal = document.getElementById('close-character-modal');
    const saveCharacterBtn = document.getElementById('save-character');

    // 联系人选择弹窗逻辑
    const contactsSelectorModal = document.getElementById('contacts-selector-modal');
    const contactsSelectorList = document.getElementById('contacts-selector-list');
    const closeContactsSelector = document.getElementById('close-contacts-selector');
    
    // 点击联系人选择弹窗外部关闭弹窗
    if (contactsSelectorModal) {
        contactsSelectorModal.addEventListener('click', (e) => {
            // 如果点击的是弹窗背景而不是内容，则关闭弹窗
            if (e.target === contactsSelectorModal) {
                contactsSelectorModal.style.display = 'none';
            }
        });
        
        // 添加一个弹动动画效果，当弹窗显示时触发
        const selectorBubble = contactsSelectorModal.querySelector('.contact-selector-bubble');
        if (selectorBubble) {
            const originalAnimation = selectorBubble.style.animation;
            contactsSelectorModal.addEventListener('transitionend', () => {
                if (contactsSelectorModal.style.display === 'flex') {
                    selectorBubble.style.animation = 'none';
                    void selectorBubble.offsetWidth; // 触发重绘
                    selectorBubble.style.animation = originalAnimation;
                }
            });
        }
    }
    
    // 渲染联系人选择器中的联系人列表
    const renderContactSelector = () => {
        const contacts = storage.load('contacts');
        if (!contactsSelectorList) return;
        
        if (contacts.length === 0) {
            contactsSelectorList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无联系人，请先添加联系人</div>';
            return;
        }
        
        // 按首字母排序并分组
        contacts.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
        
        let html = '';
        let lastChar = '';
        
        contacts.forEach(contact => {
            const firstChar = contact.name.charAt(0).toUpperCase();
            if (firstChar !== lastChar) {
                html += `<div style="padding: 5px 15px; font-size: 14px; color: #888; font-weight: 600; background: rgba(20,20,20,0.5);">${firstChar}</div>`;
                lastChar = firstChar;
            }
            
            // 根据联系人是否有头像来显示
            let avatarContent = '';
            if (contact.avatar) {
                avatarContent = `<img src="${contact.avatar}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarContent = `<i class="fa-solid fa-user"></i>`;
            }
            
            html += `
                <div class="chat-item selector-contact-item" data-id="${contact.id}" style="padding: 12px 15px; cursor: pointer;">
                    <div class="chat-avatar" style="width: 45px; height: 45px;">${avatarContent}</div>
                    <div class="chat-info" style="flex: 1;">
                        <div class="chat-name" style="font-size: 16px; color: #fff;">${contact.name}</div>
                    </div>
                </div>
            `;
        });
        
        contactsSelectorList.innerHTML = html;
        
        // 绑定选择联系人的点击事件
        const contactItems = contactsSelectorList.querySelectorAll('.selector-contact-item');
        contactItems.forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                const contact = contacts.find(c => c.id == id);
                
                if (contact) {
                    // 关闭选择器
                    contactsSelectorModal.style.display = 'none';
                    
                    // 打开聊天详情页
                    const chatDetail = document.getElementById('chat-detail');
                    const chatDetailName = chatDetail.querySelector('.chat-detail-name');
                    const chatDetailAvatar = chatDetail.querySelector('.chat-detail-avatar');
                    
                    chatDetailName.textContent = contact.name;
                    
                    // 显示联系人头像
                    if (contact.avatar) {
                        chatDetailAvatar.innerHTML = `<img src="${contact.avatar}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    } else {
                        chatDetailAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
                    }
                    
                    chatDetail.setAttribute('data-current-char-id', contact.id);
                    
                    // 应用聊天背景
                    if (contact.chatBg) {
                        chatDetail.style.backgroundImage = `url(${contact.chatBg})`;
                    } else {
                        // 恢复默认背景
                        chatDetail.style.backgroundImage = 'url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop")';
                    }
                    
                    // 应用透明度设置
                    if (contact.bubbleOpacity) {
                        document.documentElement.style.setProperty('--bubble-opacity', contact.bubbleOpacity);
                    } else {
                        document.documentElement.style.setProperty('--bubble-opacity', '0.8'); // 默认值
                    }
                    
                    chatDetail.classList.add('active');
                }
            });
        });
    };
    
    if (closeContactsSelector) {
        closeContactsSelector.addEventListener('click', () => {
            contactsSelectorModal.style.display = 'none';
        });
    }
    
    if (headerPlusBtn && newCharacterModal) {
        headerPlusBtn.addEventListener('click', () => {
            const currentTitle = messagesApp.querySelector('.app-header .title').textContent;
            if (currentTitle === '通讯录') {
                // 通讯录页面点击加号，弹出新人物设置
                newCharacterModal.removeAttribute('data-editing-id');
                newCharacterModal.querySelector('.modal-title').textContent = '新人物设置';
                document.getElementById('char-name-input').value = '';
                document.getElementById('char-persona-input').value = '';
                avatarDataUrl = null;
                avatarPreviewImg.style.display = 'none';
                avatarPreviewIcon.style.display = 'block';
                renderMountWorldbooks();
                newCharacterModal.classList.add('active');
            } else if (currentTitle === '对话') {
                // 对话页面点击加号，弹出联系人选择器
                contactsSelectorModal.style.display = 'flex';
                renderContactSelector();
                
                // 弹动动画效果
                const selectorBubble = contactsSelectorModal.querySelector('.contact-selector-bubble');
                if (selectorBubble) {
                    selectorBubble.style.animation = 'none';
                    void selectorBubble.offsetWidth; // 触发重绘
                    selectorBubble.style.animation = 'bubblePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                }
            } else {
                console.log(`在 ${currentTitle} 页面点击了加号`);
            }
        });
    }

    if (closeCharacterModal) {
        closeCharacterModal.addEventListener('click', () => {
            newCharacterModal.classList.remove('active');
        });
    }

    if (saveCharacterBtn) {
        saveCharacterBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('char-name-input');
            const personaInput = document.getElementById('char-persona-input');
            const checkboxes = document.querySelectorAll('.wb-checkbox:checked');
            const mountedWbIds = Array.from(checkboxes).map(cb => cb.value);
            const editingId = newCharacterModal.getAttribute('data-editing-id');

            let contacts = storage.load('contacts');
            
            // 构建联系人对象，包括头像
            const contactData = {
                name: nameInput.value,
                persona: personaInput.value,
                mountedWorldbooks: mountedWbIds,
                avatar: avatarDataUrl // 保存头像数据
            };

            if (editingId) {
                // 修改模式
                contacts = contacts.map(c => {
                    if (c.id == editingId) {
                        return {
                            ...c,
                            ...contactData
                        };
                    }
                    return c;
                });
            } else {
                // 新增模式
                const newContact = {
                    id: Date.now(),
                    ...contactData
                };
                contacts.push(newContact);
            }

            storage.save('contacts', contacts);
            renderContacts();
            newCharacterModal.classList.remove('active');
            
            // 重置表单
            nameInput.value = '';
            personaInput.value = '';
            avatarDataUrl = null;
            avatarPreviewImg.style.display = 'none';
            avatarPreviewIcon.style.display = 'block';
        });
    }

    const statusContent = document.getElementById('status-content');
    const meContent = document.getElementById('me-content');
    const backBtn = document.getElementById('back-to-home');
    const appHeader = messagesApp.querySelector('.app-header');

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            tabItems.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const title = tab.querySelector('span').textContent;
            messagesApp.querySelector('.app-header .title').textContent = title;

            // 状态页面和"我"页面隐藏顶栏
            if (title === '状态' || title === '我') {
                appHeader.style.display = 'none';
                chatsContent.style.display = 'none';
                contactsContent.style.display = 'none';
                statusContent.style.display = (title === '状态' ? 'block' : 'none');
                meContent.style.display = (title === '我' ? 'block' : 'none');
            } else {
                appHeader.style.display = 'flex';
                statusContent.style.display = 'none';
                meContent.style.display = 'none';
                
                // 只有"对话"页面显示返回按钮
                if (title === '对话') {
                    backBtn.style.visibility = 'visible';
                    chatsContent.style.display = 'block';
                    contactsContent.style.display = 'none';
                } else {
                    backBtn.style.visibility = 'hidden';
                    if (title === '通讯录') {
                        chatsContent.style.display = 'none';
                        contactsContent.style.display = 'block';
                    } else {
                        // 其他标签暂时显示空白
                        chatsContent.style.display = 'none';
                        contactsContent.style.display = 'none';
                    }
                }
            }
        });
    });
    
    // 初始设置CSS变量以控制气泡透明度
    document.documentElement.style.setProperty('--bubble-opacity', '0.8');
});
