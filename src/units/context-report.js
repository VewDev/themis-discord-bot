// Reports the message to specified channel in config.json. Get the channel id by right clicking any channel on discord in developer mode, and copying the id.

const { ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { Unit } = require('../lib/units');
const { GodotEmbedBuilder } = require('../lib/helpers');

const unit = new Unit();

unit.createContextMenuCommand()
	.setName('Quickly Report to Staff')
	.setType(ApplicationCommandType.Message)
	.setCallback(async interaction => {

		if (!interaction.isMessageContextMenuCommand()) return;

		await sendMessage(interaction, "", interaction)

	});


unit.createContextMenuCommand()
	.setName('Report Message with Context')
	.setType(ApplicationCommandType.Message)
	.setCallback(async interaction => {

		if (!interaction.isMessageContextMenuCommand()) return;

		// Create a modal to ask for additional context
		const modal = new ModalBuilder()
			.setCustomId(interaction.id)
			.setTitle('Report User');
		const contextInput = new TextInputBuilder()
				.setCustomId('contextInput')
				.setStyle(TextInputStyle.Paragraph)
		const contextLabel = new LabelBuilder()
			.setLabel("Additional context")
			.setDescription('Add any context that may be useful for moderators when they see this message.')
			.setTextInputComponent(contextInput);

		// Show the modal
		modal.addLabelComponents(contextLabel);
		await interaction.showModal(modal);
		const modalResponse = await interaction
			.awaitModalSubmit({
				time: 180_000,
				filter: (modalSubmit) => 
				{
					if (modalSubmit.customId == interaction.id) return true;
					return false;
				}
			})

		
		const contextResponse = modalResponse.fields.getTextInputValue('contextInput');


		await sendMessage(interaction, contextResponse, modalResponse)
	});

async function sendMessage(interaction, contextResponse, responseInteraction) {

	const modChannel = unit.config.guildConfigs[interaction.guildId].modChannel;
	const modRole = unit.config.guildConfigs[interaction.guildId].modRole;

	// Send message to mod channel
	const channel = interaction.client.channels.cache.get(modChannel);
	const reportedMessage = interaction.targetMessage;

	let reporterEmbedText = ``
		+ `:bust_in_silhouette: Created by: <@${interaction.user.id}>\n`
		+ `:clock1: Report Time (localized): <t:${Math.floor(Date.now() / 1000)}:R>\n`

	let regex = new RegExp("`", 'g');
	contextResponse = contextResponse.replace(regex, '')
	if (contextResponse != "") {

		reporterEmbedText = reporterEmbedText
			+ `## Additional Context Added:\n`
			+ `\`\`\`${contextResponse}\`\`\``
	}

	const reporterEmbed = new GodotEmbedBuilder()
		.setAuthor({ name: `Reporter: ` + interaction.user.username, iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL})
		.setDescription(reporterEmbedText);
	
	const reportedEmbedText = `:gdbonk: Reported User: <@${reportedMessage.author.id}>\n`
		+ `:map: Channel Name: \`${reportedMessage.channel.name}\`\n`
		+ `:clock1: Message Time (localized): <t:${Math.floor(reportedMessage.createdTimestamp / 1000)}:R>`
	
	const reportedEmbed = new EmbedBuilder()
		.setColor('#29292d')
		.setAuthor({ name: `Reported: ` + reportedMessage.author.username, iconURL: reportedMessage.author.avatarURL() ?? reportedMessage.author.defaultAvatarURL})
		.setDescription(reportedEmbedText);

	const embeds = [ reporterEmbed, reportedEmbed ];

	channel.send({ content: `<@&${modRole}> New Report Created`, embeds: embeds });

	reportedMessage.forward(channel);

	await responseInteraction.reply({ flags: MessageFlags.Ephemeral, content: 'Message has been reported. A staff member will check soon.' });
}

module.exports = unit;