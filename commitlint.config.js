export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // новая функциональность
        "fix", // исправление бага
        "docs", // документация
        "style", // форматирование (не CSS!)
        "refactor", // рефакторинг без изменения поведения
        "perf", // улучшение производительности
        "test", // тесты
        "chore", // обслуживание (deps, configs)
        "ci", // CI/CD
        "revert", // откат коммита
      ],
    ],
    // тема не длиннее 72 символов
    "subject-max-length": [2, "always", 72],
  },
};
