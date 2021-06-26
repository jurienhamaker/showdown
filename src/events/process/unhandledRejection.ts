import { DiscordAPIError, Constants } from 'discord.js';
import Util from '../../Util.js';

export default {
    name: 'unhandledRejection',
    process: true,
    async run(err: DiscordAPIError): Promise<unknown> {
        const ignore: number[] = [
            Constants.APIErrors.MISSING_PERMISSIONS,
            Constants.APIErrors.UNKNOWN_MESSAGE,
            Constants.APIErrors.MISSING_ACCESS,
            Constants.APIErrors.CANNOT_MESSAGE_USER,
            Constants.APIErrors.UNKNOWN_CHANNEL,
            Constants.APIErrors.INVALID_FORM_BODY
        ];
    
        if (ignore.includes(err.code)) return console.log(`Unhandled Rejection: \`\`\`\n${`${err.stack  }\n\nJSON: ${  JSON.stringify(err, null, 2)}`}\n\`\`\``);
        return Util.log(`Unhandled Rejection: \`\`\`\n${`${err.stack  }\n\nJSON: ${  JSON.stringify(err, null, 2)}`}\n\`\`\``);
    }
};