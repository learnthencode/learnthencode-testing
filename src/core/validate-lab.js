/**
 * Validates a LearnThenCode lab configuration object (learnthencode.json).
 *
 * Required fields and their purpose:
 *   - `id`       — unique lab identifier used for tracking progress.
 *   - `lesson`   — links the lab to a specific lesson in the curriculum.
 *   - `title`    — human-readable lab name shown in course UIs.
 *   - `language` — the primary language being tested (e.g. "html").
 *   - `entry`    — relative path to the file the tests should run against.
 *   - `version`  — lab config version for compatibility checks.
 *
 * @param {object} lab - The parsed learnthencode.json object.
 * @throws {Error} If any required field is missing from the configuration.
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