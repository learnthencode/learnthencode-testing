/**
 * Validates a LearnThenCode lab configuration.
 *
 * @param {object} lab
 */
export function validateLab(lab) {

  const requiredFields = [
    "id",
    "lesson",
    "title",
    "language",
    "entry",
    "version",
  ];

  for (const field of requiredFields) {

    if (!(field in lab)) {

      throw new Error(
        `Invalid LearnThenCode lab configuration. Missing required property: "${field}".`
      );

    }

  }

}