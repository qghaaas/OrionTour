export default function LoginForm({
    onOpenRegistration,
    onForgotPassword,
    onSuccess,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSuccess();
    };

    return (
        <div>
            <h2>Вход в личный кабинет</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="E-mail" required />
                <input type="password" placeholder="Пароль" required />
                <button className="auth-forgot" type="button" onClick={onForgotPassword}>
                    Забыли пароль?
                </button>
                <button className="auth-activeBTN" type="submit">Войти в кабинет</button>
            </form>
            <button className="auth-notreg" type="button" onClick={onOpenRegistration}>
                Ещё не зарегистрированы?
            </button>
        </div>
    );
}