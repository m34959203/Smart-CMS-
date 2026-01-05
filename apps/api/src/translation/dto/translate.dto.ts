import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export enum TranslationLanguage {
  KAZAKH = 'kk',
  RUSSIAN = 'ru',
}

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsEnum(TranslationLanguage)
  @IsNotEmpty()
  sourceLanguage!: TranslationLanguage;

  @IsEnum(TranslationLanguage)
  @IsNotEmpty()
  targetLanguage!: TranslationLanguage;
}

export class TranslateArticleDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsEnum(TranslationLanguage)
  @IsNotEmpty()
  sourceLanguage!: TranslationLanguage;

  @IsEnum(TranslationLanguage)
  @IsNotEmpty()
  targetLanguage!: TranslationLanguage;
}
