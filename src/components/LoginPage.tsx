import { FormEvent, useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck, UserRound, UserPlus } from 'lucide-react';
import { login, registrar } from '../services/authService';
import { getErrorMessage } from '../lib/api';
import { type AuthResponse } from '../types/api';

type LoginPageProps = {
  onLogin: (session: AuthResponse) => void;
};

type AuthMode = 'login' | 'register';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>('O primeiro cadastro do sistema vira ADMIN. Os próximos cadastros entram como CLIENTE.');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !senha.trim()) {
      setError('Informe e-mail e senha.');
      return;
    }

    if (mode === 'register' && !nome.trim()) {
      setError('Informe seu nome para criar a conta.');
      return;
    }

    setLoading(true);

    try {
      const response = mode === 'login'
        ? await login({ email: email.trim(), senha })
        : await registrar({ nome: nome.trim(), email: email.trim(), senha });

      onLogin(response);
    } catch (error) {
      setError(getErrorMessage(error, 'Não foi possível autenticar.')); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell login-shell">
      <section className="login-card">
        <div className="login-hero">
          <span className="brand-icon big">🍔🔥</span>
          <p className="eyebrow">Boca de Brasa</p>
          <h1>Peça quente, receba rápido</h1>
          <p>
            Escolha seu hambúrguer, monte o pedido, acompanhe o preparo e receba tudo quentinho.
          </p>

          <div className="login-benefits">
            <span>Pedido acompanhado em tempo real</span>
            <span>Delivery, retirada ou balcão</span>
            <span>Pix, dinheiro ou cartão</span>
          </div>
        </div>

        <div className="login-panel-wrap">
          <form className="login-panel" onSubmit={handleSubmit}>
            <div className="login-panel-heading">
              <span className={mode === 'register' ? 'login-icon admin' : 'login-icon'}>
                {mode === 'register' ? <UserPlus size={26} /> : <ShieldCheck size={26} />}
              </span>
              <div>
                <p className="eyebrow">Acesso ao sistema</p>
                <h2>{mode === 'login' ? 'Login' : 'Criar conta'}</h2>
                <p>
                  {mode === 'login'
                    ? 'Entre com e-mail e senha para acessar sua área.'
                    : 'Crie sua conta para acessar o cardápio e acompanhar seus pedidos.'}
                </p>
              </div>
            </div>

            <div className="login-tabs" role="tablist" aria-label="Modo de acesso">
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setInfo('Entre com o e-mail e senha cadastrados.');
                }}
              >
                Entrar
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setInfo('O primeiro cadastro vira ADMIN. Depois disso, os novos cadastros viram CLIENTE.');
                }}
              >
                Criar conta
              </button>
            </div>

            <div className="login-fields">
              {mode === 'register' && (
                <label>
                  <span>Nome</span>
                  <div className="login-input">
                    <UserRound size={18} />
                    <input
                      value={nome}
                      onChange={(event) => setNome(event.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                    />
                  </div>
                </label>
              )}

              <label>
                <span>E-mail</span>
                <div className="login-input">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label>
                <span>Senha</span>
                <div className="login-input">
                  <LockKeyhole size={18} />
                  <input
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </label>
            </div>

            {info && <div className="login-hint">{info}</div>}
            {error && <div className="login-error">{error}</div>}

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
