export default function RegistrationForm({
    onOpenLogin,
    onCodeSent,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onCodeSent();
    };

    return (
                <div >
                    <h2>Регистрация</h2>
                    <form onSubmit={handleSubmit}>
                        <input type="email" placeholder="E-mail" required />
                        <input type="password" placeholder="Пароль" required />
                        <input type="password" placeholder="Повторите пароль" required />
                        <button type="submit">Зарегистрироваться</button>
                    </form>
                    <button type="button" onClick={onOpenLogin}>
                        Уже есть аккаунт?
                    </button>
                </div>
    );
}