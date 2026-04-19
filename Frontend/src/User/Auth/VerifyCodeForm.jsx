import { useState } from "react";

export default function VerifyCodeForm({ email, onSuccess }) {
  const [code, setCode] = useState(["", "", "", ""]);

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // переход к следующему input
    if (value && index < code.length - 1) {
      const nextInput = document.querySelector(
        `input[data-index="${index + 1}"]`
      );

      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      code[index] === "" &&
      index > 0
    ) {
      const prevInput = document.querySelector(
        `input[data-index="${index - 1}"]`
      );

      prevInput?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fullCode = code.join("");

    if (fullCode.length !== 4) return;

    onSuccess();
  };

  return (
    <div>
      <h2>Введите код из письма</h2>

      <div className="verify-sub_text">
        <p>Мы отправили его на почту</p>
        <p>{email}</p>
      </div>

      <form className="form-verify" onSubmit={handleSubmit}>
        <div className="verify-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              data-index={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
            />
          ))}
        </div>

        <button type="submit">
          Подтвердить
        </button>
      </form>

      <button className="verify-cod" type="button">
        Отправить новый код
      </button>
    </div>
  );
}