

const COMMON_PASSWORDS = [
  "password","123456","qwerty","letmein","admin","welcome","monkey","dragon",
  "master","shadow","sunshine","princess","football","iloveyou","superman",
  "batman","trustno1","696969","1234567890","password1","abc123","baseball",
  "michael","jessica","123123","pass","hello","login","default","changeme",
  "test","guest","root","secret","access","owner"
];
 
let passwordHistory = [];
let historyVisible = false;
let showingPassword = false;
 
function toggleVisibility() {
  const input = document.getElementById('pwInput');
  const btn = document.getElementById('eyeBtn');
  showingPassword = !showingPassword;
  input.type = showingPassword ? 'text' : 'password';
  btn.textContent = showingPassword ? '🙈 Hide' : '👁 Show';
}
 
function hashSimulate(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, '0').repeat(4).slice(0, 32) + '…';
}
 
function calcEntropy(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  return pw.length ? (pw.length * Math.log2(pool || 1)).toFixed(1) : 0;
}
 
function timeToCrack(entropy) {
  const combinations = Math.pow(2, parseFloat(entropy));
  const seconds = combinations / 1e12;
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return Math.round(seconds) + ' seconds';
  if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
  if (seconds < 86400) return Math.round(seconds / 3600) + ' hours';
  if (seconds < 31536000) return Math.round(seconds / 86400) + ' days';
  if (seconds < 3.154e10) return Math.round(seconds / 31536000) + ' years';
  return Math.round(seconds / 3.154e10) + ' centuries';
}
 
function getScore(pw) {
  let s = 0;
  if (pw.length >= 12) s += 20;
  if (pw.length >= 16) s += 10;
  if (/[a-z]/.test(pw)) s += 10;
  if (/[A-Z]/.test(pw)) s += 15;
  if (/[0-9]/.test(pw)) s += 15;
  if (/[^a-zA-Z0-9]/.test(pw)) s += 15;
  if (!COMMON_PASSWORDS.includes(pw.toLowerCase())) s += 10;
  if (!(/(.)\1{2,}/.test(pw))) s += 3;
  if (!/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg)/i.test(pw)) s += 2;
  return Math.min(s, 100);
}
 
function getAlternatives(pw) {
  const words = ['Maple','River','Tiger','Crimson','Delta','Falcon','Prism','Echo','Storm','Granite'];
  const syms  = ['!','@','#','$','&','*'];
  const rW = () => words[Math.floor(Math.random() * words.length)];
  const rS = () => syms[Math.floor(Math.random() * syms.length)];
  const rN = () => String(Math.floor(Math.random() * 900) + 100);
 
  let strengthened = pw;
  if (!/[A-Z]/.test(strengthened)) strengthened = strengthened.charAt(0).toUpperCase() + strengthened.slice(1);
  if (!/[0-9]/.test(strengthened)) strengthened += rN();
  if (!/[^a-zA-Z0-9]/.test(strengthened)) strengthened += rS();
  if (strengthened.length < 16) strengthened += rW();
 
  return [
    { type: 'Passphrase',           pw: `${rW()}-${rW()}-${rW()}-${rN()}` },
    { type: 'Strengthened version', pw: strengthened },
    { type: 'Random strong',        pw: generateRandom(20) },
    { type: 'Memorable + secure',   pw: `${rW()}${rS()}${rN()}${rW()}${rS()}` }
  ];
}
 
function generateRandom(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&*-_=+';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
 
function analyze() {
  const pw = document.getElementById('pwInput').value;
 
  if (!pw) {
    document.getElementById('meterFill').style.width = '0';
    document.getElementById('scoreLabel').textContent = '—';
    document.getElementById('scoreNum').textContent = '';
    document.getElementById('statLen').textContent = '—';
    document.getElementById('statEnt').textContent = '—';
    document.getElementById('statCrack').textContent = '—';
    document.getElementById('checksGrid').innerHTML = '';
    document.getElementById('altGrid').innerHTML = '';
    document.getElementById('reuseWarn').style.display = 'none';
    document.getElementById('suggestions-wrap').style.display = 'none';
    document.getElementById('success-wrap').style.display = 'none';
    return;
  }
 
  const checks = {
    'Lowercase letters':    /[a-z]/.test(pw),
    'Uppercase letters':    /[A-Z]/.test(pw),
    'Numbers':              /[0-9]/.test(pw),
    'Special characters':   /[^a-zA-Z0-9]/.test(pw),
    '12+ characters':       pw.length >= 12,
    'Not a common password':!COMMON_PASSWORDS.includes(pw.toLowerCase()),
    'No repeated characters':!/(.)\1{2,}/.test(pw),
    'No sequences':         !/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg)/i.test(pw)
  };
 
  const score   = getScore(pw);
  const entropy = calcEntropy(pw);
  const crack   = timeToCrack(entropy);
 
  const levels = [
    { min: 0,  label: 'Very weak',   color: '#E24B4A' },
    { min: 25, label: 'Weak',        color: '#EF9F27' },
    { min: 45, label: 'Fair',        color: '#BA7517' },
    { min: 65, label: 'Strong',      color: '#639922' },
    { min: 85, label: 'Very strong', color: '#1D9E75' }
  ];
  const level = levels.filter(l => score >= l.min).pop();
 
  document.getElementById('meterFill').style.width    = score + '%';
  document.getElementById('meterFill').style.background = level.color;
  document.getElementById('scoreLabel').textContent   = level.label;
  document.getElementById('scoreLabel').style.color   = level.color;
  document.getElementById('scoreNum').textContent     = `Score: ${score}/100`;
  document.getElementById('statLen').textContent      = pw.length;
  document.getElementById('statEnt').textContent      = entropy + ' bits';
  document.getElementById('statCrack').textContent    = crack;
 
  // Checks grid
  document.getElementById('checksGrid').innerHTML = Object.entries(checks).map(([label, pass]) =>
    `<div class="check-item ${pass ? 'pass' : 'fail'}">${pass ? '✅' : '❌'} ${label}</div>`
  ).join('');
 
  // Reuse check
  const isReused = passwordHistory.some(h => h.hash === hashSimulate(pw));
  document.getElementById('reuseWarn').style.display = isReused ? 'block' : 'none';
 
  // Suggestions
  const suggestions = [];
  if (!checks['12+ characters'])        suggestions.push('Use at least 12 characters — longer passwords are exponentially harder to crack.');
  if (!checks['Uppercase letters'])     suggestions.push('Add uppercase letters (A–Z) to increase the character pool.');
  if (!checks['Special characters'])    suggestions.push('Include special characters like !@#$ to boost entropy.');
  if (!checks['Not a common password']) suggestions.push('This is a commonly known password — attackers try these first.');
  if (!checks['No repeated characters'])suggestions.push('Avoid repeating characters (e.g. "aaa").');
  if (!checks['No sequences'])          suggestions.push('Avoid keyboard sequences like 123 or abc — easy to guess.');
 
  if (suggestions.length) {
    document.getElementById('suggestions-wrap').style.display = 'block';
    document.getElementById('success-wrap').style.display = 'none';
    document.getElementById('suggestionsBox').innerHTML = suggestions.map(s =>
      `<div class="suggestion-item"><span class="icon">💡</span><span>${s}</span></div>`
    ).join('');
  } else {
    document.getElementById('suggestions-wrap').style.display = 'none';
    document.getElementById('success-wrap').style.display = 'block';
  }
 
  // Alternatives
  const alts = getAlternatives(pw);
  document.getElementById('altGrid').innerHTML = alts.map(a =>
    `<div class="alt-card" onclick="copyAlt('${a.pw.replace(/'/g,"\\'")}', this)">
      <div class="alt-type">${a.type}</div>
      <div class="alt-pw">${a.pw}</div>
    </div>`
  ).join('');
}
 
function copyAlt(pw, el) {
  navigator.clipboard.writeText(pw).then(() => {
    const label = el.querySelector('.alt-type');
    const orig  = label.textContent;
    label.textContent = '✅ Copied!';
    setTimeout(() => label.textContent = orig, 1200);
  });
}
 
function saveToHistory() {
  const pw = document.getElementById('pwInput').value;
  if (!pw) return;
  const hash    = hashSimulate(pw);
  const isReuse = passwordHistory.some(h => h.hash === hash);
  passwordHistory.unshift({ hash, score: getScore(pw), reused: isReuse });
  if (passwordHistory.length > 8) passwordHistory.pop();
  document.getElementById('histCount').textContent = passwordHistory.length;
  renderHistory();
  analyze();
}
 
function renderHistory() {
  const box = document.getElementById('historyBox');
  if (!passwordHistory.length) {
    box.innerHTML = '<p class="muted">No passwords saved yet.</p>';
    return;
  }
  box.innerHTML = passwordHistory.map((h, i) =>
    `<div class="history-item">
      <span class="history-hash">${h.hash}</span>
      <span style="display:flex;align-items:center;gap:8px">
        <span style="font-size:11px;color:#aaa">score ${h.score}</span>
        <span class="badge ${i === 0 ? 'new' : 'reused'}">${i === 0 ? 'new' : 'reused'}</span>
      </span>
    </div>`
  ).join('');
}
 
function toggleHistory() {
  historyVisible = !historyVisible;
  document.getElementById('historyPanel').style.display = historyVisible ? 'block' : 'none';
}
 