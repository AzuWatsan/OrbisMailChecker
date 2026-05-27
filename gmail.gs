/**
 * 新規メール処理
 */
function processNewMails_() {
  const label = getOrCreateLabel_(CONFIG.PROCESSED_LABEL);
  const threads = GmailApp.search(CONFIG.NEW_MAIL_QUERY, 0, CONFIG.MAX_THREADS);
  const processedIds = getProcessedIds_(CONFIG.PROCESSED_IDS_KEY);

  threads.forEach(thread => {
    if (threadHasLabel_(thread, label)) return;

    const targetMsg = findTargetMessage_(thread, { replyMode: false });
    if (!targetMsg) return;

    const messageId = targetMsg.getId();
    if (processedIds[messageId]) return;

    const subject = targetMsg.getSubject() || '';
    const body = targetMsg.getPlainBody() || '';
    const block = extractMainBlock_(body);

    if (block) {
      const person = extractPerson_(block);
      const text = buildBacklogText_(person, block);
      slackPostWithReply_(subject, text);
    } else {
      slackPostWithReply_(subject, '⚠️ 手動確認が必要です');
    }

    processedIds[messageId] = new Date().getTime();
    thread.addLabel(label);
  });

  saveProcessedIds_(CONFIG.PROCESSED_IDS_KEY, processedIds);
}

/**
 * 返信メール処理：件名をまとめて1投稿
 */
function processReplyMails_() {
  const threads = GmailApp.search(CONFIG.REPLY_MAIL_QUERY, 0, CONFIG.MAX_THREADS);
  const processedIds = getProcessedIds_(CONFIG.PROCESSED_REPLY_IDS_KEY);

  const subjects = [];

  threads.forEach(thread => {
    const messages = thread.getMessages();

    messages.forEach(msg => {
      const subject = msg.getSubject() || '';
      if (!isReplySubject_(subject)) return;

      const messageId = msg.getId();
      if (processedIds[messageId]) return;

      subjects.push(subject);
      processedIds[messageId] = new Date().getTime();
    });
  });

  if (subjects.length > 0) {
    slackPost_('📬 *返信メール一覧*\n```' + subjects.join('\n') + '```');
  }

  saveProcessedIds_(CONFIG.PROCESSED_REPLY_IDS_KEY, processedIds);
}

/**
 * 返信件名かどうか判定
 * 例: Re: [reco_desk:001] ... / [reco_desk:001] Re: ...
 */
function isReplySubject_(subject) {
  return /^Re:\s*\[reco_desk:/i.test(subject) || /^\[reco_desk:[^\]]+\]\s*Re:/i.test(subject);
}

/**
 * スレッド内で条件に一致するメッセージを返す
 */
function findTargetMessage_(thread, { replyMode }) {
  const messages = thread.getMessages();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const subject = msg.getSubject() || '';
    const to = msg.getTo() || '';
    const cc = msg.getCc() || '';
    const bcc = msg.getBcc() || '';
    const allRecipients = (to + ',' + cc + ',' + bcc).toLowerCase();

    if (!replyMode && /\b(re|fw|fwd)\s*:/i.test(subject)) continue;
    if (!allRecipients.includes(CONFIG.TARGET_TO.toLowerCase())) continue;
    if (!subject.includes(CONFIG.TARGET_SUBJECT)) continue;

    return msg;
  }
  return null;
}

// ── 本文処理 ────────────────────────────────────────────

function extractMainBlock_(text) {
  if (!text) return null;
  const normalized = text.replace(/\r\n/g, '\n');
  const match = normalized.match(
    /━━━━━━━━━━━━━━━━━━━━━━━━━\n?([\s\S]*?)\n?━━━━━━━━━━━━━━━━━━━━━━━━━/
  );
  return match ? match[1].trim() : null;
}

function extractPerson_(block) {
  if (!block) return 'ご担当者様';
  const match = block.match(/担当者[：:]\s*(.+?(?:様|さま))/);
  if (!match) return 'ご担当者様';
  return match[1].trim().replace(/さま$/, '様');
}

function buildBacklogText_(person, block) {
  const normalizedBlock = normalizeForBacklog_(block);
  const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━';
  const header =
    `オルビス：${person}\n` +
    `ご依頼いただきましたタグ設置のご連絡となります。`;
  return [header, '', separator, normalizedBlock, separator].join('\n');
}

function normalizeForBacklog_(text) {
  if (!text) return '';
  let t = text.replace(/\r\n/g, '\n').trim();
  t = t.replace(/^━━━━━━━━━━━━━━━━━━━━━━━━━\n?/, '');
  t = t.replace(/\n?━━━━━━━━━━━━━━━━━━━━━━━━━$/, '');
  t = t.replace(/^[\-]{5,}$/gm, '━━━━━━━━━━━━━━━━━━━━━━━━━');
  t = t.split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

// ── ユーティリティ ───────────────────────────────────────

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function threadHasLabel_(thread, label) {
  return thread.getLabels().some(l => l.getName() === label.getName());
}