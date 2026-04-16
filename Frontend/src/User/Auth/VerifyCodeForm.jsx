export default function VerifyCodeForm({ onSuccess }) {
  const [code, setCode] = useState(["", "", "", ""]);

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length !== 4) return;

    onSuccess();
  };

  return (
        <div>
          <h2>Введите код</h2>
          <form onSubmit={handleSubmit}>
            <div>
              {code.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                />
              ))}
            </div>
            <button type="submit">Подтвердить</button>
          </form>
          <button type="button">Отправить новый код</button>
        </div>
  );
}