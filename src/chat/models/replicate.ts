import { setTimeout } from "timers/promises";
import { Prediction } from "replicate";

import { GPTGenerationError, GPTGenerationErrorType } from "../../error/gpt/generation.js";
import { ReplicateChatSettingsModel } from "../../conversation/settings/model.js";
import { ChatModel, ModelCapability, ModelType } from "../types/model.js";
import { getPromptLength } from "../../conversation/utils/length.js";
import { ModelGenerationOptions } from "../types/options.js";
import { PartialResponseMessage } from "../types/message.js";
import { ChatClient } from "../client.js";

export class ReplicateModel extends ChatModel {
    constructor(client: ChatClient) {
        super(client, {
            name: "Replicate",
            type: ModelType.Replicate,

            capabilities: [ ModelCapability.UserLanguage ]
        });
    }

    public async complete(options: ModelGenerationOptions): Promise<PartialResponseMessage> {
        /* If the tone class for some reason doesn't match as it should, throw an error. */
        if (!(options.settings instanceof ReplicateChatSettingsModel)) throw new Error("Wrong tone class for Replicate; must be ReplicateChatTone");
        const tone: ReplicateChatSettingsModel = options.settings as ReplicateChatSettingsModel;

        /* Name of the model, split into two parts */
        const [ modelOwner, modelName ] = tone.options.settings.model!.split("/");

        /* Replicate model for the tone */
        const model = await this.client.session.manager.bot.replicate.api.models.get(modelOwner, modelName);

        const format = (output: string[] | null): string | null => {
            if (output === null) return null;
            if (tone.formatter) return tone.formatter(output);

            /* Concatenate the output tokens together. */
            const concatenated: string = typeof output === "string" ? output : output.join("");
            return concatenated;
        }

        /* Input object for the model */
        const input: any = await tone.build(this.client, options);

        /* Start the prediction. */
        const prediction: Prediction = await this.client.session.manager.bot.replicate.api.predictions.create({
            version: model.latest_version!.id,
            input: input as object
        });

        /* Latest prediction result */
        let latest: Prediction = null!;
        const started: number = Date.now();

        do {
            /* Get the latest prediction result. */
            latest = await this.client.session.manager.bot.replicate.api.predictions.get(prediction.id);
            if (!latest.output) continue;
            
            const formatted: string | null = format(latest.output);
            if (formatted) options.progress({ text: formatted });

            await setTimeout(1000);
        } while (latest.output === null || (latest.status === "starting" || latest.status === "processing"));

        if (latest === null || latest.error || latest.status === "failed") throw new GPTGenerationError({
            type: GPTGenerationErrorType.Other
        });

        const final: string = format(latest.output)!;
        
        return {
            text: final,

            raw: {
                usage: {
                    prompt: getPromptLength(input.prompt),
                    completion: getPromptLength(final)
                },

                duration: prediction.metrics?.predict_time ? prediction.metrics?.predict_time * 1000 : Date.now() - started 
            }
        };
    }
}