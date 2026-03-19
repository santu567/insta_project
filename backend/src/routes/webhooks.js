import { Router } from 'express';
import { verifyWebhookSignature } from '../services/graphApi.js';
import { enqueueWebhook, enqueueStoryWebhook } from '../services/webhookQueue.js';

const router = Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

router.post('/', async (req, res) => {
  console.log('====== INCOMING WEBHOOK ======');
  console.log('Headers:', req.headers);
  const rawBody = req.rawBody; // Use the raw Buffer attached by express.json()

  const signature = req.headers['x-hub-signature-256'];

  if (!verifyWebhookSignature(rawBody, signature || '')) {
    console.error('Webhook signature verification failed!');
    return res.status(401).send('Invalid signature');
  }
  console.log('Signature verified.');

  res.status(200).send('OK');

  const { entry } = req.body;
  console.log('Webhook payload entry:', JSON.stringify(entry, null, 2));
  if (!entry) return;

  for (const item of entry) {
    // Handle Comment webhooks
    const changes = item.changes || [];
    for (const change of changes) {
      if (change.field !== 'comments') continue;

      const value = change.value;
      const mediaId = value.media?.id;
      const commentId = value.id;
      const commenterId = value.from?.id;
      const commenterUsername = value.from?.username;
      const commentText = (value.text || '').trim().toUpperCase();

      if (!mediaId || !commenterId || !commentText) continue;

      await enqueueWebhook({
        commentId,
        commenterId,
        commenterUsername,
        mediaId,
        commentText
      });
    }

    // Handle Story Mentions & Story Replies (come via messaging field)
    const messaging = item.messaging || [];
    for (const msg of messaging) {
      const senderId = msg.sender?.id;
      const recipientId = msg.recipient?.id;
      const messageData = msg.message;

      if (!senderId || !recipientId || !messageData) continue;

      // Detect story mentions (someone mentioned you in their story)
      const storyMention = messageData.attachments?.find(
        (a) => a.type === 'story_mention'
      );

      // Detect story replies (someone replied to your story)
      const storyReply = messageData.is_echo ? null : messageData.reply_to?.story;

      if (storyMention || storyReply) {
        console.log(`[Webhook] 📸 Story ${storyMention ? 'mention' : 'reply'} detected from ${senderId}`);
        await enqueueStoryWebhook({
          senderId,
          recipientId,
          type: storyMention ? 'story_mention' : 'story_reply',
          storyUrl: storyMention?.payload?.url || storyReply?.url || null,
          timestamp: msg.timestamp
        });
      }
    }
  }
});

export default router;
