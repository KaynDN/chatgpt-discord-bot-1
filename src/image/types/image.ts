import { Snowflake } from "discord.js";

import { StableHordeGenerationFilter } from "./filter.js";
import { StableHordeModel } from "./model.js";

export interface RawImageGenerationResult {
    /* URL of the generated image */
    img: string;
    
    /* Seed to reproduce this image */
    seed: string;
    
    /* Unique identifier of the image */
    id: string;

    /* Whether the generated image was censored by the worker */
    censored: boolean;
}

export interface ImageGenerationResult {
    /* Seed to reproduce this image */
    seed: string;

    /* URL to the temporary Stable Horde CDN */
    url: string;
    
    /* Unique identifier of the image */
    id: string;

    /* Whether the generated image was censored by the worker */
    censored: boolean;
}

export interface ImageGenerationCheckData {
    finished: number;
    processing: number;
    restarted: number;
    waiting: number;

    /* Whether the generation has finished for all images */
    done: boolean;

    /* Whether the generation failed */
    faulted: boolean;

    /* How long we apprx. have to wait for */
    wait_time: number;

    /* Position in the queue for this request */
    queue_position: number;

    /* Whether the generation is possible */
    is_possible: boolean;

    /* How many kudos were used for this request */
    kudos: number;

    /* ID of this running generation request */
    id: string;
}

export type ImageGenerationStatusData = ImageGenerationCheckData & {
    generations: RawImageGenerationResult[];
}

export type StableHordeGenerationResult = Pick<ImageGenerationCheckData, "kudos"> & {
    images: ImageGenerationResult[];
    id: string;

    /* How long the generation took */
    duration: number;

    /* When it started */
    requested: number;

    /* When it finished */
    completed: number;
}

export interface ImageGenerationPrompt {
    /* Things to include in the image */
    prompt: string;

    /* Things to *not* include in the image */
    negative?: string;

    /* Additional tags to include; not actually being used */
    tags?: string;

    /* Which filter was used */
    filter?: StableHordeGenerationFilter;
}

export interface DatabaseImage {
    /* Unique identifier of the generation request */
    id: string;

    /* Which Discord user initiated this request */
    author: Snowflake;

    /* When the generation was requested & completed */
    requested: string;
    completed: string;

    /* Rating given by the user, optional */
    rating: number | null;

    /* Generation options used for this image */
    options: ImageGenerationOptions;

    /* Generated images by Stable Horde */
    results: ImageGenerationResult[];

    /* How much the image cost to generate */
    cost: number;

    /* Which prompt was used to generate the image */
    prompt: ImageGenerationPrompt;

    /* Whether the image is NSFW */
    nsfw: boolean;
}

export const ImageGenerationSamplers = [
    "k_lms", "k_heun", "k_euler", "k_euler_a", "k_dpm_fast", "k_dpm_adaptive", "k_dpmpp_2m", "k_dpmpp_sde"
]

export type ImageGenerationSampler = typeof ImageGenerationSamplers[number]

export interface ImageGenerationParameters {
    cfg_scale?: number;
    clip_skip?: number;
    denoising_strength?: number;
    height: number;
    seed?: string;
    seed_variation?: number;
    width: number;
    hires_fix?: boolean;
    karras?: boolean;
    n: number;
    post_processing?: string[];
    sampler_name: ImageGenerationSampler;
    steps?: number;
}

export interface ImageGenerationOptions {
    /* Whether NSFW should be shown */
    nsfw: boolean;

    /* Whether the generation request should be given priority; by using the API key with kudos */
    priority: boolean;

    /* Whether to share the image with LAION */
    shared: boolean;

    /* Model to use for generation */
    model: StableHordeModel;

    /* Parameters for the generation request */
    params: ImageGenerationParameters;

    /* Source image, if applicable */
    source: ImageInput | null;

    /* Image generation prompt to use */
    prompt: ImageGenerationPrompt;
}

export interface ImageInput {
    /* URL to the image */
    url: string;
}