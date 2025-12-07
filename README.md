<h1>Bingo Mobile — React Native + FastAPI</h1>

<p><strong>Bingo Mobile</strong> to wieloosobowa aplikacja typu <em>task bingo</em>. Użytkownicy tworzą lub dołączają do pokoi, otrzymują losowe zadania z kategorii <em>Nauka</em> lub <em>Sport</em>, a następnie rywalizują, aby jako pierwsi ukończyć linię 5×5.
Projekt składa się z mobilnego frontendu (React Native + Expo) oraz backendu (FastAPI + SQLAlchemy).</p>

<hr />

<h2>Funkcjonalności</h2>

<h3>Użytkownicy</h3>
<ul>
  <li>Rejestracja i logowanie z użyciem JWT (<code>/auth/register</code>, <code>/auth/login</code>).</li>
  <li>Profil użytkownika zawierający:
    <ul>
      <li>liczbę rozegranych gier,</li>
      <li>liczbę zwycięstw,</li>
      <li>współczynnik wygranych (winrate),</li>
      <li>liczbę utworzonych pokoi (endpoint <code>/profile/me</code>).</li>
    </ul>
  </li>
</ul>

<h3>Pokoje</h3>
<ul>
  <li>Tworzenie pokoju z opcjonalnym hasłem (haszowanie PBKDF2).</li>
  <li>Kategorie pokoi: <em>Nauka</em> oraz <em>Sport</em>.</li>
  <li>Maksymalnie pięciu graczy w jednym pokoju.</li>
  <li>Automatyczne przydzielanie unikalnego koloru gracza (gdy brak dostępnych — losowanie).</li>
  <li>Losowanie 25 zadań z wybranej kategorii (plansza 5×5).</li>
</ul>

<h3>Rozgrywka</h3>
<ul>
  <li>Każde zadanie może zostać wykonane tylko raz; pierwszy gracz blokuje pole.</li>
  <li>System wykrywa:
    <ul>
      <li>bingo w wierszu, kolumnie lub na przekątnej,</li>
      <li>zwycięstwo największą liczbą pól (gdy brak bingo, a plansza jest zapełniona),</li>
      <li>remis, gdy kilku graczy ma tyle samo ukończonych pól.</li>
    </ul>
  </li>
  <li>Po zakończeniu rozgrywki aktualizowane są statystyki wszystkich graczy uczestniczących w pokoju.</li>
</ul>

<h3>Chat</h3>
<ul>
  <li>Komunikacja tekstowa dostępna wyłącznie dla członków pokoju (<code>/rooms/{room_id}/messages</code>).</li>
  <li>Walidacja przynależności użytkownika do pokoju.</li>
</ul>

<hr />

<h2>Technologie</h2>

<h3>Backend</h3>
<ul>
  <li>FastAPI + Uvicorn</li>
  <li>SQLAlchemy ORM</li>
  <li>Pydantic v2</li>
  <li>JWT (biblioteka <code>jose</code>)</li>
  <li>PBKDF2 jako metoda bezpiecznego haszowania haseł</li>
  <li>Automatyczne generowanie zadań kategorii <em>Nauka</em> i <em>Sport</em> przy pierwszym uruchomieniu bazy danych</li>
</ul>

<h3>Frontend</h3>
<ul>
  <li>React Native + Expo</li>
  <li>SecureStore / AsyncStorage do przechowywania tokenów (Android / Web)</li>
  <li>Moduły komunikacji z API:
    <ul>
      <li><code>auth.js</code> – rejestracja, logowanie, tokeny</li>
      <li><code>rooms.js</code> – tworzenie pokoi, dołączanie, zadania</li>
      <li><code>chat.js</code> – pobieranie i wysyłanie wiadomości</li>
      <li><code>profile.js</code> – dane użytkownika</li>
    </ul>
  </li>
</ul>

<hr />

<h2>Struktura projektu</h2>

<pre><code>/backend
  ├── main.py
  ├── routers/
  │     ├── auth.py
  │     ├── rooms.py
  │     ├── chat.py
  │     └── profile.py
  ├── models.py
  ├── schemas.py
  ├── security.py
  ├── tasks.py
  └── db.py

/frontend
  ├── app/
  │    ├── screens/
  │    ├── components/
  │    └── ...
  ├── auth.js
  ├── rooms.js
  ├── chat.js
  └── profile.js
</code></pre>

<hr />

<h2>Uruchomienie backendu (FastAPI)</h2>

<ol>
  <li>Instalacja zależności:
    <pre><code>pip install -r requirements.txt</code></pre>
  </li>
  <li>Uruchomienie serwera:
    <pre><code>uvicorn main:app --reload</code></pre>
  </li>
</ol>

<p>Backend działa domyślnie pod adresem:</p>

<pre><code>http://localhost:8000</code></pre>

<p>Dokumentacja interfejsu API:</p>

<pre><code>http://localhost:8000/docs</code></pre>

<hr />

<h2>Uruchomienie frontendu (Expo)</h2>

<ol>
  <li>Instalacja zależności:
    <pre><code>npm install</code></pre>
  </li>
  <li>Uruchomienie aplikacji:
    <pre><code>npx expo start</code></pre>
  </li>
  <li>Adres backendu konfigurowany jest w <code>auth.js</code>:
    <pre><code>export const API_URL =
  Platform.OS === "web" ? "http://localhost:8000" : "http://10.0.2.2:8000";</code></pre>
    <p>Web: <code>http://localhost:8000</code><br />
    Android Emulator: <code>http://10.0.2.2:8000</code></p>
  </li>
</ol>

<hr />

<h2>Bezpieczeństwo</h2>

<p>System wykorzystuje następujące mechanizmy:</p>

<h3>PBKDF2</h3>
<ul>
  <li>Własna implementacja haszowania haseł.</li>
  <li>Losowa sól dla każdego hasła.</li>
  <li>100 000 iteracji funkcji PBKDF2.</li>
</ul>

<h3>JWT</h3>
<ul>
  <li>Token tworzony podczas logowania.</li>
  <li>Zawiera identyfikator użytkownika oraz czas wygaśnięcia.</li>
</ul>

<h3>Walidacja dostępu</h3>
<ul>
  <li>Dostęp do pokoi wyłącznie dla ich członków.</li>
  <li>Zadania mogą być oznaczone jako ukończone tylko raz.</li>
  <li>Właściciel pokoju dołącza do niego automatycznie w momencie tworzenia.</li>
  <li>Backend oblicza zwycięzcę i kończy rozgrywkę.</li>
</ul>

<hr />

<h2>Skrócony przegląd API</h2>

<h3>Auth</h3>
<ul>
  <li><code>POST /auth/register</code></li>
  <li><code>POST /auth/login</code></li>
</ul>

<h3>Profile</h3>
<ul>
  <li><code>GET /profile/me</code></li>
  <li><code>PUT /profile/me</code></li>
</ul>

<h3>Rooms</h3>
<ul>
  <li><code>GET /rooms</code></li>
  <li><code>POST /rooms</code></li>
  <li><code>POST /rooms/{id}/join</code></li>
</ul>

<h3>Tasks</h3>
<ul>
  <li><code>GET /rooms/{id}/tasks</code></li>
  <li><code>GET /rooms/{id}/tasks/{asg_id}/finished</code></li>
</ul>

<h3>Chat</h3>
<ul>
  <li><code>GET /rooms/{id}/messages</code></li>
  <li><code>POST /rooms/{id}/messages</code></li>
</ul>

<hr />

<h2>Planowane rozszerzenia</h2>

<ul>
  <li>Komunikacja w czasie rzeczywistym (WebSocket)</li>
  <li>Historia gier użytkownika</li>
  <li>System rankingowy</li>
  <li>Powiadomienia push (Expo Notifications)</li>
</ul>
