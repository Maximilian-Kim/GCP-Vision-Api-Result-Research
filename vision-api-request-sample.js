/**
 * 가시화 Project에 사용된 annotation set 생성용 코드
 * GCP의 Cloud Vision API 와 Cloud Translate API 사용설정 및 Service Key 가 필요하다
 * 번역이 필요없다면 translation 로직은 수정 필요
 * Vision API : https://cloud.google.com/vision/docs/refrence/rest
 * Translate API : https://cloud.google.com/translate/docs/reference/rest
 */
const fs = require("fs");

const Vision = require("@google-cloud/vision"); // npm i @google-cloud/vision
const Translate = require("@google-cloud/translate"); // npm i @google-cloud/translate
const visionKey = require("<Your gcp-vision-api-key.json>");
const translateKey = require("<Your gcp-translate-api-key.json>");

async function main() {
  const visionClient = new Vision.ImageAnnotatorClient({
    credentials: visionKey,
  });

  const translateLanguage = "ko";

  const fileNames = [
    "cat_80_01",
    "cat_160_01",
    "cat_320_01",
    "cat_640_01",
    "cat_1920_01",
    "cat_1280_01",
  ];

  for (const f of fileNames) {
    const request = {
      image: {
        source: {
          // use one of [gcsImageUri or imageUri]
          // 로컬 이미지를 전송하려면 문서를 참고할 것
          // gcsImageUri: `gs://${bucket name}/${f}.jpg`,
          // imageUri: `https://${online file path}/${f}.jpg`
        },
      },
      features: [
        {
          maxResults: 50,
          type: "LABEL_DETECTION",
        },
        {
          maxResults: 50,
          type: "OBJECT_LOCALIZATION",
        },
      ],
    };

    const [result] = await visionClient.annotateImage(request);
    const labelAnnotations = result.labelAnnotations;
    const localizedObjectAnnotations = result.localizedObjectAnnotations;
    const label = [];
    const labelAwaiter = [];
    for (const annotation of labelAnnotations) {
      const obj = {
        label: annotation.description,
        score: fixPrecision(annotation.score),
      };
      labelAwaiter.push(
        translateTextAdvance(annotation.description, translateLanguage)
      );
      label.push(obj);
    }

    const labelTranslates = await Promise.all(labelAwaiter);

    label.map((item, index) => {
      item.translate = labelTranslates[index];
      return item;
    });

    const object = [];
    const objectAwaiter = [];
    for (const annotation of localizedObjectAnnotations) {
      const obj = {
        name: annotation.name,
        score: fixPrecision(annotation.score),
        bbox: [
          [
            fixPrecision(annotation.boundingPoly.normalizedVertices[0].x),
            fixPrecision(annotation.boundingPoly.normalizedVertices[0].y),
          ],
          [
            fixPrecision(annotation.boundingPoly.normalizedVertices[1].x),
            fixPrecision(annotation.boundingPoly.normalizedVertices[1].y),
          ],
          [
            fixPrecision(annotation.boundingPoly.normalizedVertices[2].x),
            fixPrecision(annotation.boundingPoly.normalizedVertices[2].y),
          ],
          [
            fixPrecision(annotation.boundingPoly.normalizedVertices[3].x),
            fixPrecision(annotation.boundingPoly.normalizedVertices[3].y),
          ],
        ],
      };
      objectAwaiter.push(
        translateTextAdvance(annotation.name, translateLanguage)
      );
      object.push(obj);
    }

    const objectTranslates = await Promise.all(objectAwaiter);

    object.map((item, index) => {
      item.translate = objectTranslates[index];
      return item;
    });

    const output = JSON.stringify({ label, object });
    fs.writeFileSync(`annotations/${f}.json`, output);

    console.log(`done ${f}`);
    // break
  }
}

function fixPrecision(value, presicion = 4) {
  try {
    const fixed = value.toFixed(presicion);
    return Number.parseFloat(fixed);
  } catch (err) {
    return value;
  }
}

async function translateTextAdvance(text, languageCode) {
  const projectId = translateKey.project_id;
  const translateClient = new Translate.TranslationServiceClient({
    projectId: projectId,
    credentials: translateKey,
  });

  const request = {
    parent: `projects/${projectId}/locations/global`,
    contents: [text],
    mimeType: "text/plain",
    sourceLanguageCode: "en",
    targetLanguageCode: languageCode,
  };

  try {
    let [translations] = await translateClient.translateText(request);
    return translations.translations[0].translatedText;
  } catch (err) {
    console.log(err);
  }
}

main();
