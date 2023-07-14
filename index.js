const axios = require('axios');

// ฟังก์ชันสำหรับแสกนภาพเพื่อรับข้อความที่แสดงในภาพ
async function scanImageForText(imageUrl) {
  try {
    const apiKey = '19709c5d60a643cfabf2097da447ef0b'; // แทนที่ด้วย API key ของคุณ
    const apiUrl = 'https://superai.cognitiveservices.azure.com/vision/v3.0/analyze';

    const requestData = {
      visualFeatures: ['Text'],
      imageUrl: imageUrl
    };

    const headers = {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': apiKey
    };

    const response = await axios.post(apiUrl, requestData, { headers });
    const json = response.data;

    if (json.recognitionResult && json.recognitionResult.lines) {
      const text = json.recognitionResult.lines.map(line => line.text).join('\n');
      return text;
    } else {
      return 'ไม่สามารถแสกนข้อความจากภาพได้';
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการแสกนภาพ:', error);
    return 'เกิดข้อผิดพลาดในการแสกนภาพ';
  }
}

// ฟังก์ชันสำหรับส่งข้อความกลับไปยังผู้ส่ง
async function replyMessage(replyToken, text) {
  try {
    const lineMessagingAPIUrl = 'https://api.line.me/v2/bot/message/reply';

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'bYLCOElOHRO7yhmX19XRMcafu10R/P39zvRdVyrV5qPJceeJe/fWiz9v7a+r7JTgZS3TXnL5/BCDg5XyHrOxLtMvP1ZyhLRXFVfOH0PnyW3hQaLv4wY0XSPDdqbrhJBDerR0ZuZT9gA8/6zkhy6umQdB04t89/1O/w1cDnyilFU=' // แทนที่ด้วย Channel Access Token ของคุณ
    };

    const payload = {
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: text
        }
      ]
    };

    await axios.post(lineMessagingAPIUrl, payload, { headers });
    console.log('ส่งข้อความกลับเรียบร้อยแล้ว');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งข้อความ:', error);
  }
}

// ฟังก์ชันสำหรับดูแลเหตุการณ์ LINE
async function processLineEvent(event) {
  try {
    if (event.type === 'message' && event.message.type === 'image') {
      const replyToken = event.replyToken;
      const imageUrl = event.message.contentProvider.originalContentUrl;

      // ส่งข้อความ "กรุณารอสักครู่..." ก่อนที่จะเริ่มแสกนภาพ
      await replyMessage(replyToken, 'กรุณารอสักครู่...');

      // แสกนภาพเพื่อรับข้อความ
      const text = await scanImageForText(imageUrl);

      // ส่งข้อความกลับไปยังผู้ส่ง
      await replyMessage(replyToken, text);
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดูแลเหตุการณ์ LINE:', error);
  }
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const events = body.events;

    for (const event of events) {
      await processLineEvent(event);
    }

    return {
      statusCode: 200,
      body: 'OK'
    };
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดูแลเหตุการณ์ LINE:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};