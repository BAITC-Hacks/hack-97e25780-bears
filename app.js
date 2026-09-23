const questionSet = [
  { id: 'users', targetField: 'users', text: 'Кто будет пользоваться результатом и в какой ситуации?' },
  { id: 'data', targetField: 'data', text: 'Какие данные или материалы доступны команде?' },
  { id: 'expected-result', targetField: 'expectedResult', text: 'Какой конкретный результат вы ожидаете получить?' },
  { id: 'success-criteria', targetField: 'successCriteria', text: 'По каким измеримым признакам вы примете работу?' },
  { id: 'constraints', targetField: 'constraints', text: 'Какие есть сроки, технические ограничения и ограничения доступа?' },
  { id: 'interaction', targetField: 'interactionFormat', text: 'Как команда сможет консультироваться с представителем бизнеса?' },
];

const categories = [
  ['contextAndNeed', 'Контекст и потребность', 20], ['dataAndMaterials', 'Данные и материалы', 20],
  ['expectedResult', 'Ожидаемый результат', 15], ['successCriteria', 'Критерии успеха', 15],
  ['constraints', 'Ограничения', 10], ['users', 'Пользователи', 10], ['businessConnection', 'Связь с бизнесом', 10],
];
const fieldRules = [
  ['context', 'contextAndNeed', 10, 'Подробно опишите текущую ситуацию и проблему.'], ['need', 'contextAndNeed', 10, 'Уточните потребность бизнеса и ожидаемое изменение.'],
  ['data', 'dataAndMaterials', 20, 'Перечислите доступные данные, материалы и их формат.'], ['expectedResult', 'expectedResult', 15, 'Опишите конкретный результат работы команды.'],
  ['successCriteria', 'successCriteria', 15, 'Добавьте измеримое значение к критериям успеха.'], ['constraints', 'constraints', 10, 'Уточните сроки, технологии и ограничения доступа.'],
  ['users', 'users', 10, 'Подробно опишите пользователей и их рабочий процесс.'], ['contact', 'businessConnection', 5, 'Укажите корректный email или телефон представителя бизнеса.'], ['interactionFormat', 'businessConnection', 5, 'Опишите регулярность и канал консультаций с бизнесом.'],
];
const $ = (id) => document.getElementById(id);
const state = { answers: {}, confirmed: false, published: false, failFirstRequest: new URLSearchParams(location.search).has('questionsError') };

function textCoefficient(value) { const length = (value || '').trim().length; return length === 0 ? 0 : length < 40 ? .5 : 1; }
function contactCoefficient(value) { const text = (value || '').trim(); if (!text) return 0; const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text); const digits = text.replace(/\D/g, ''); return (mail || (/^[+\d\s().-]+$/.test(text) && digits.length >= 7)) ? 1 : .5; }
function coefficient(field, value) { if (field === 'successCriteria') return !(value || '').trim() ? 0 : /\d|%/.test(value) ? 1 : .5; if (field === 'contact') return contactCoefficient(value); return textCoefficient(value); }
function rating(values) {
  const breakdown = Object.fromEntries(categories.map(([key]) => [key, 0])); const weak = [];
  fieldRules.forEach(([field, category, weight, suggestion], index) => { const c = coefficient(field, values[field]); breakdown[category] += weight * c; if (c < 1) weak.push({ index, lost: weight * (1 - c), suggestion }); });
  const score = Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
  return { score, breakdown, suggestions: weak.sort((a, b) => b.lost - a.lost || a.index - b.index).map((item) => item.suggestion), level: score >= 90 ? 'priority' : score >= 70 ? 'ready' : score >= 40 ? 'working' : 'draft' };
}
function values() { return Object.fromEntries(new FormData($('card-form')).entries()); }
function updateRating() {
  const result = rating(values()); $('score').textContent = result.score; const names = { draft: 'Черновик', working: 'В работе', ready: 'Готово', priority: 'Приоритет' };
  $('rating-level').textContent = names[result.level]; $('rating-level').className = `level ${result.level}`;
  $('score-description').textContent = state.confirmed ? 'Рейтинг зафиксирован по подтверждённой карточке.' : 'Предварительный рейтинг. Подтвердите карточку, чтобы зафиксировать его.';
  $('breakdown').innerHTML = categories.map(([key, label, max]) => `<div class="breakdown-item"><span>${label}</span><div class="bar"><i style="width:${(result.breakdown[key] / max) * 100}%"></i></div><em>${result.breakdown[key]} / ${max}</em></div>`).join('');
  $('suggestions').innerHTML = result.suggestions.length ? result.suggestions.map((tip) => `<li>${tip}</li>`).join('') : '<li>Карточка заполнена полностью — можно публиковать.</li>';
  return result;
}
function showCard() { $('card-section').hidden = false; $('rating-section').hidden = false; }
function requestQuestions() {
  const draft = $('draft').value.trim(); $('draft-error').hidden = Boolean(draft); if (!draft) return;
  $('questions-button').disabled = true; $('questions-loading').hidden = false; $('request-error').hidden = true;
  window.setTimeout(() => {
    $('questions-button').disabled = false; $('questions-loading').hidden = true;
    if (state.failFirstRequest) { state.failFirstRequest = false; $('request-error').hidden = false; return; }
    renderQuestions();
  }, 650);
}
function renderQuestions() {
  $('questions-section').hidden = false; $('questions-list').innerHTML = questionSet.map((question, index) => `<label class="question"><p>${index + 1}. ${question.text}</p><textarea rows="2" data-target="${question.targetField}" placeholder="Ваш ответ"></textarea></label>`).join('');
  document.querySelectorAll('[data-target]').forEach((input) => input.addEventListener('input', (event) => { state.answers[event.target.dataset.target] = event.target.value; const target = document.querySelector(`[name="${event.target.dataset.target}"]`); if (target) target.value = event.target.value; updateRating(); }));
  $('questions-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function applyAnswers() { Object.entries(state.answers).forEach(([name, value]) => { const input = document.querySelector(`[name="${name}"]`); if (input) input.value = value; }); }
function validateForConfirmation(card) {
  if (!card.title.trim()) return 'Добавьте название задачи перед подтверждением.';
  if (!card.context.trim() && !card.need.trim()) return 'Заполните контекст или потребность задачи перед подтверждением.';
  if (!card.contact.trim()) return 'Добавьте контакт для связи с бизнесом перед подтверждением.';
  if (contactCoefficient(card.contact) < 1) return 'Укажите корректный email или телефон для связи с бизнесом.';
  return '';
}
$('draft').addEventListener('input', () => { $('draft-count').textContent = `${$('draft').value.length} символов`; $('draft-error').hidden = true; });
$('questions-button').addEventListener('click', requestQuestions); $('retry-button').addEventListener('click', requestQuestions);
$('to-card-button').addEventListener('click', () => { applyAnswers(); showCard(); $('card-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('card-form').addEventListener('input', updateRating);
$('confirm-button').addEventListener('click', () => { const message = validateForConfirmation(values()); $('confirmation-error').hidden = !message; $('confirmation-error').textContent = message; if (message) return; state.confirmed = true; $('card-form').classList.add('locked'); $('card-form').querySelectorAll('input,textarea').forEach((el) => el.disabled = true); $('confirm-button').hidden = true; $('edit-button').hidden = false; $('card-state').textContent = 'Подтверждено'; $('publish-button').disabled = false; updateRating(); });
$('edit-button').addEventListener('click', () => { state.confirmed = false; $('card-form').classList.remove('locked'); $('card-form').querySelectorAll('input,textarea').forEach((el) => el.disabled = false); $('confirm-button').hidden = false; $('edit-button').hidden = true; $('card-state').textContent = 'Черновик'; $('publish-button').disabled = true; updateRating(); });
$('publish-button').addEventListener('click', () => { state.published = true; $('publish-button').disabled = true; $('publish-button').textContent = 'Опубликовано'; $('publish-status').textContent = 'Задача опубликована локально. Экран каталога будет добавлен следующим шагом.'; });
document.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => { const team = button.dataset.role === 'team'; $('business-view').hidden = team; $('team-view').hidden = !team; document.querySelectorAll('.role').forEach((role) => role.classList.toggle('active', role.dataset.role === button.dataset.role)); }));
