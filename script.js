import ossConfig from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const initialView = document.getElementById('initial-view');
    const lotteryView = document.getElementById('lottery-view');
    const resultView = document.getElementById('result-view');
    const giftBox = document.querySelector('.gift-box');
    const redPackets = document.querySelectorAll('.red-packet');
    const uploadBtn = document.getElementById('upload-btn');
    const qrUpload = document.getElementById('qr-upload');

    // 初始化 OSS 客户端
    const client = new OSS({
        region: ossConfig.region,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        bucket: ossConfig.bucket,
        endpoint: ossConfig.endpoint
    });

    // 点击礼物盒子
    giftBox.addEventListener('click', () => {
        initialView.classList.remove('active');
        lotteryView.classList.add('active');
        shuffleRedPackets();
    });

    // 随机打乱红包
    function shuffleRedPackets() {
        const redPacketsArray = Array.from(redPackets);
        const container = document.querySelector('.red-packets');
        
        for (let i = redPacketsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            container.appendChild(redPacketsArray[j]);
        }
    }

    // 点击红包
    redPackets.forEach(packet => {
        packet.addEventListener('click', () => {
            // 无论点击哪个红包，都显示200元
            lotteryView.classList.remove('active');
            resultView.classList.add('active');
            
            // 添加动画效果
            resultView.style.animation = 'fadeIn 0.5s ease forwards';
        });
    });

    // 处理上传按钮点击
    uploadBtn.addEventListener('click', () => {
        qrUpload.click();
    });

    // 处理文件上传
    qrUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            uploadBtn.disabled = true;
            uploadBtn.textContent = '上传中...';

            // 生成文件名
            const fileExt = file.name.split('.').pop();
            const fileName = `qr_codes/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            // 上传到阿里云 OSS
            const result = await client.multipartUpload(fileName, file, {
                progress: (p) => {
                    const percent = Math.floor(p * 100);
                    uploadBtn.textContent = `上传中 ${percent}%`;
                }
            });

            // 发送通知到您的服务器或邮箱
            await sendNotification({
                fileUrl: result.url,
                uploadTime: new Date().toISOString(),
                fileName: fileName
            });

            alert('收款码上传成功！红包将很快转入您的账户~');
            uploadBtn.textContent = '上传成功';
        } catch (error) {
            console.error('上传错误:', error);
            alert('抱歉，上传遇到了问题，请稍后再试');
            uploadBtn.textContent = '重新上传';
        } finally {
            uploadBtn.disabled = false;
        }
    });

    // 发送通知的函数
    async function sendNotification(data) {
        // 这里替换为您的通知接口地址
        const notificationUrl = 'YOUR_NOTIFICATION_ENDPOINT';
        
        try {
            const response = await fetch(notificationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('通知发送失败');
            }
        } catch (error) {
            console.error('通知发送错误:', error);
            // 通知失败不影响用户体验，所以这里不抛出错误
        }
    }
}); 