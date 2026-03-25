const {
  AttachmentBuilder,
  Client,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SeparatorSpacingSize
} = require('discord.js');
const { getConfig, getSettings, setEmoji, getOrCreateUserRecord, updateUserRecord } = require('./storage');
const { getProgress, formatRelative, renderMilestoneCard } = require('./cardRenderer');

const PREFIX = '-';

const config = getConfig();
const TOKEN = config.bot?.token;

if (!TOKEN || TOKEN === 'PUT_YOUR_BOT_TOKEN_HERE') {
  throw new Error('Missing bot.token in config.json.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

function parseSetCommand(message, type, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('Only admins can configure badge emojis.');
  }

  const level = Number(args[0]);
  const emoji = args[1];
  if (!Number.isInteger(level) || level < 1 || level > config.milestones.totalLevels || !emoji) {
    return message.reply(`Usage: -set-${type} <level 1-${config.milestones.totalLevels}> <emoji>`);
  }

  setEmoji(type, level, emoji);
  return message.reply(`Updated ${type} level ${level} emoji to ${emoji}`);
}

async function hasLikelyNitro(user) {
  const full = await user.fetch(true);
  return Boolean(
    full.avatar?.startsWith('a_')
    || full.avatarDecorationData
    || full.banner
  );
}

async function resolveStartTimestamp(type, message) {
  const record = getOrCreateUserRecord(message.author.id);

  if (type === 'boost') {
    const boostStart = message.member?.premiumSinceTimestamp;
    if (!boostStart) return null;

    if (!record.boostStart || record.boostStart !== boostStart) {
      updateUserRecord(message.author.id, { boostStart });
    }

    return boostStart;
  }

  const isNitro = await hasLikelyNitro(message.author);
  if (!isNitro) return null;

  if (record.nitroStart) return record.nitroStart;

  const now = Date.now();
  updateUserRecord(message.author.id, { nitroStart: now });
  return now;
}

function formatExactDate(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function sendMilestoneMessage(message, type) {
  const settings = getSettings();
  const emojis = settings[type];

  const startedAt = await resolveStartTimestamp(type, message);
  if (!startedAt) {
    await message.reply('خد خمسه جنيه صدقه 😂');
    return;
  }

  const progress = getProgress(startedAt, config.milestones.months);
  const progressLine = progress.atMax
    ? 'You reached the final badge milestone.'
    : `You will reach next badge in: ${formatRelative(progress.remaining)}`;

  const image = await renderMilestoneCard({
    currentLevel: progress.level,
    brandTitle: config.brand.title,
    canvasSize: config.theme.canvas,
    totalLevels: config.milestones.totalLevels,
    type,
    progressLine,
    emojis
  });

  const fileName = `${type}-milestone-${message.author.id}.png`;
  const attachment = new AttachmentBuilder(image, { name: fileName });

  const startedLabel = type === 'nitro' ? 'Nitro' : 'Boosted';
  const currentEmoji = emojis[String(progress.level)] || '⭐';
  const nextEmoji = emojis[String(progress.nextLevel)] || '⭐';

  const startedText = `${startedLabel}: ${formatRelative(progress.elapsed)} ago | ${formatExactDate(startedAt)}`;
  const nextBadgeText = progress.atMax
    ? 'Next Badge: MAX level reached'
    : `Next Badge: Level ${progress.nextLevel} ${nextEmoji}`;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${config.brand.title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(`attachment://${fileName}`))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `**${startedText}**`,
        `**Level:** ${progress.level} ${currentEmoji}`,
        `**${nextBadgeText}**`,
        '—',
        `*${progressLine}*`
      ].join('\n'))
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(config.brand.footer));

  await message.channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    files: [attachment]
  });
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const [command, ...args] = message.content.trim().split(/\s+/);
  const normalized = command.toLowerCase();

  try {
    if (normalized === '-set-nitro') return parseSetCommand(message, 'nitro', args);
    if (normalized === '-set-boost') return parseSetCommand(message, 'boost', args);
    if (normalized === '-nitro') return sendMilestoneMessage(message, 'nitro');
    if (normalized === '-boost') return sendMilestoneMessage(message, 'boost');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await message.reply('Something went wrong while building your premium milestone card.');
  }

  return null;
});

client.once('ready', () => {
  // eslint-disable-next-line no-console
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
