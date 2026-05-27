function slackPost_(text) {
  return slackRequest_({ text });
}

function slackPostWithReply_(subject, text) {
  // 親：件名
  const parentData = slackRequest_({ text: `📩 *${subject}*` });
  const threadTs = parentData.ts;

  // リプライ：整形結果
  slackRequest_({ thread_ts: threadTs, text });
}

function slackRequest_(payload) {
  const token = getSlackToken_();
  const channelId = getSlackChannelId_();

  if (!token) throw new Error('SLACK_BOT_TOKEN が未設定です');
  if (!channelId) throw new Error('SLACK_CHANNEL_ID が未設定です');

  const res = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ channel: channelId, ...payload }),
    muteHttpExceptions: true
  });

  const data = JSON.parse(res.getContentText());
  if (!data.ok) throw new Error('Slack投稿失敗: ' + data.error);
  return data;
}