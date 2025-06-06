const scenario = {
  title: "پروژه فرهنگسرای پویای تهران",
  kpis: { budget: 0, schedule: 0, quality: 0, risk: 0, stakeholder: 0 },
  phases: [
    {
      name: "فاز آغازین",
      challenges: [
        {
          id: "1.1",
          text: "مهندس احمدی... اولین گام رسمی و اساسی شما در این مرحله چیست؟",
          options: [
            {
              text: "اجرای دستور مهندس احمدی",
              feedback: "شروع کار بدون تعریف رسمی...",
              effects: { risk: +20, stakeholder: +5 }
            },
            {
              text: "درخواست جلسه برای تدوین منشور پروژه",
              feedback: "تصمیم بسیار درستی است! ...",
              effects: { risk: -10, stakeholder: -2, quality: +10 }
            },
            {
              text: "شروع به جمع‌آوری نیازمندی‌ها",
              feedback: "جمع‌آوری نیازمندی‌ها بخش مهمی است...",
              effects: { risk: +5, schedule: -1, quality: -5 }
            }
          ]
        },
        {
          id: "1.2",
          text: "منشور پروژه با موفقیت تدوین و تصویب شد...",
          options: [
            {
              text: "اکتفا به لیست موجود در منشور پروژه",
              feedback: "نادیده گرفتن ذینفعان ...",
              effects: { risk: +15, stakeholder: -10, quality: -5 }
            },
            {
              text: "برگزاری جلسات طوفان فکری و تحلیل ذینفعان",
              feedback: "عالی! شناسایی فعالانه ...",
              effects: { risk: -10, stakeholder: +5, schedule: -2 }
            },
            {
              text: "تمرکز صرف بر ذینفعان با قدرت بالا",
              feedback: "اگرچه مدیریت ذینفعان قدرتمند...",
              effects: { risk: +5, stakeholder: -15 }
            }
          ]
        }
      ]
    }
        ,{
      name: "فاز برنامه‌ریزی",
      challenges: [{
        id: "2.1",
        text: "ذینفعان مختلف ... چگونه نیازمندی‌ها را جمع‌آوری می‌کنید؟",
        options: [{
          text: "اولویت‌بندی بر اساس نظر شهردار",
          feedback: "این رویکرد ممکن است به نارضایتی سایر ذینفعان منجر شود.",
          effects: { stakeholder: -20, quality: -10, risk: +10 }
        },{
          text: "برگزاری کارگاه‌های نیازمندی‌سنجی",
          feedback: "بسیار هوشمندانه! ...",
          effects: { quality: +15, risk: -15, stakeholder: +10 }
        }]
      }]
    },{
      name: "فاز اجرا",
      challenges: [{
        id: "3.1",
        text: "آقای شریفی و خانم تقوی دچار اختلاف شده‌اند...",
        options: [{
          text: "حمایت از ارشد",
          feedback: "حل تعارض بر اساس ارشدیت می‌تواند مشکل‌ساز باشد.",
          effects: { quality: -10, stakeholder: -15 }
        },{
          text: "برگزاری جلسه مشترک",
          feedback: "مدیریت تعارض با همکاری بهترین روش است.",
          effects: { quality: +10, stakeholder: +10 }
        }]
      }]
    }
  ]
};

let phaseIndex = 0;
let challengeIndex = 0;

function updateView() {
  const phase = scenario.phases[phaseIndex];
  const challenge = phase.challenges[challengeIndex];
  document.getElementById("project-title").innerText = scenario.title;
  document.getElementById("process-group").innerText = phase.name;
  document.getElementById("narrative").innerText = challenge.text;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  challenge.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => selectOption(idx);
    optionsDiv.appendChild(btn);
  });
  updateKPIs();
}

function updateKPIs() {
  const k = scenario.kpis;
  document.getElementById("kpi-budget").innerText = k.budget;
  document.getElementById("kpi-schedule").innerText = k.schedule;
  document.getElementById("kpi-quality").innerText = k.quality;
  document.getElementById("kpi-risk").innerText = k.risk;
  document.getElementById("kpi-stakeholder").innerText = k.stakeholder;
}

function selectOption(i) {
  const phase = scenario.phases[phaseIndex];
  const challenge = phase.challenges[challengeIndex];
  const opt = challenge.options[i];
  document.getElementById("feedback-text").innerText = opt.feedback;
  for (const key in opt.effects) {
    scenario.kpis[key] += opt.effects[key];
  }
  document.getElementById("feedback").style.display = "block";
  document.getElementById("continue-btn").onclick = () => {
    document.getElementById("feedback").style.display = "none";
    nextChallenge();
  };
}

function nextChallenge() {
  const phase = scenario.phases[phaseIndex];
  challengeIndex++;
  if (challengeIndex >= phase.challenges.length) {
    phaseIndex++;
    challengeIndex = 0;
    if (phaseIndex >= scenario.phases.length) {
      document.getElementById("narrative").innerText = "پایان بازی";
      document.getElementById("options").innerHTML = "";
      updateKPIs();
      return;
    }
  }
  updateView();
}

updateView();
