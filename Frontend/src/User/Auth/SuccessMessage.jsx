export default function SuccessMessage({ onClose }) {
  return (
        <div>
          <h2>Добро пожаловать!</h2>
          <p>Вы успешно вошли в личный кабинет.</p>
          <button type="button" onClick={onClose}>
            Продолжить
          </button>
        </div>
  );
}