"use client";
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { 
  Download, Dumbbell, Utensils, Activity, 
  ArrowRight, CheckCircle, Moon, Sun, 
  User, Calendar, Target, Flame, BicepsFlexed, Scale, Ruler, HeartPulse 
} from "lucide-react";
// IMPORT YOUR DATA FILES
import { malePlans } from "./data/malePlan";
import { femalePlans } from "./data/femalePlan";

// --- TYPES ---
type PlanType = "workout" | "diet" | "both";
type Goal = "lose_weight" | "gain_weight" | "tone";
type Location = "home" | "gym";
type Equipment = "bodyweight" | "dumbbells";
type DietType = "non_veg" | "veg" | "egg";
type Gender = "male" | "female";
type Duration = "1" | "2" | "3" | "4";
type Unit = "metric" | "imperial";

interface UserData {
  name: string;
  gender: Gender;
  age: string;
  height: string; 
  weight: string; 
  neck: string;   
  waist: string;  
  hip: string;    
  planType: PlanType;
  duration: Duration;
  goal: Goal;
  location: Location;
  equipment: Equipment;
  dietType: DietType;
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [unit, setUnit] = useState<Unit>("metric"); 
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  
  // STATS
  const [bmiValue, setBmiValue] = useState<number | null>(null);
  const [bfp, setBfp] = useState<number | null>(null);
  const [dailyCalories, setDailyCalories] = useState<number | null>(null);
  const [bfpCategory, setBfpCategory] = useState("");
  
  const [result, setResult] = useState<{ workout: string; diet: string } | null>(null);
  const [ageMeta, setAgeMeta] = useState<{focus: string, advice: string} | null>(null);

  const [formData, setFormData] = useState<UserData>({
    name: "",
    gender: "female", 
    age: "",
    height: "",
    weight: "",
    neck: "",   
    waist: "",  
    hip: "",    
    planType: "both",
    duration: "4",
    goal: "lose_weight",
    location: "home",
    equipment: "bodyweight",
    dietType: "non_veg",
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- LOGIC: CALCULATION ENGINE ---
  const calculateStats = () => {
    let height = parseFloat(formData.height);
    let weight = parseFloat(formData.weight);
    let age = parseFloat(formData.age);

    if (!height || !weight || !age) return;

    let heightInMeters = height;
    let heightInCm = height;

    if (unit === "imperial") {
      heightInMeters = height * 0.0254; 
      heightInCm = height * 2.54;
    } else {
      heightInMeters = height / 100;
    }

    // BMI
    const bmi = weight / (heightInMeters * heightInMeters);
    setBmiValue(parseFloat(bmi.toFixed(1)));

    // BFP (BMI Method)
    let calculatedBfp = 0;
    if (formData.gender === 'male') {
      calculatedBfp = (1.20 * bmi) + (0.23 * age) - 16.2;
    } else {
      calculatedBfp = (1.20 * bmi) + (0.23 * age) - 5.4;
    }
    if (isNaN(calculatedBfp) || calculatedBfp < 1) calculatedBfp = 1;
    setBfp(parseFloat(calculatedBfp.toFixed(1)));

    // Category
    let cat = "Average";
    if (formData.gender === 'female') {
      if (calculatedBfp < 14) cat = "Essential Fat";
      else if (calculatedBfp < 21) cat = "Athletes";
      else if (calculatedBfp < 25) cat = "Fitness";
      else if (calculatedBfp < 32) cat = "Average";
      else cat = "Obese";
    } else {
      if (calculatedBfp < 6) cat = "Essential Fat";
      else if (calculatedBfp < 14) cat = "Athletes";
      else if (calculatedBfp < 18) cat = "Fitness";
      else if (calculatedBfp < 25) cat = "Average";
      else cat = "Obese";
    }
    setBfpCategory(cat);

    // Calories (Mifflin-St Jeor)
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = (10 * weight) + (6.25 * heightInCm) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * heightInCm) - (5 * age) - 161;
    }

    let maintenance = bmr * 1.375;
    let targetCals = maintenance;

    if (formData.goal === 'lose_weight') targetCals = maintenance - 500;
    else if (formData.goal === 'gain_weight') targetCals = maintenance + 300;

    setDailyCalories(Math.round(targetCals));
    setStep(2);
  };

  // --- LOGIC: PLAN GENERATOR ---
  const generatePlan = () => {
    setLoading(true);
    
    setTimeout(() => {
      let workoutPlan = "";
      let dietPlan = "";
      const age = parseInt(formData.age);
      
      let ageKey = "18-27";
      if (age >= 18 && age <= 27) ageKey = "18-27";
      else if (age >= 28 && age <= 37) ageKey = "28-37";
      else if (age >= 38 && age <= 47) ageKey = "38-47";
      else if (age >= 48 && age <= 57) ageKey = "48-57";
      else if (age >= 58) ageKey = "58+";

      // Access Data Files safely
      const planData = formData.gender === 'male' 
        ? (malePlans as any)[ageKey] 
        : (femalePlans as any)[ageKey];
      
      setAgeMeta({ focus: planData.focus, advice: planData.advice });

      // --- WORKOUT GENERATION ---
      if (formData.planType === "workout" || formData.planType === "both") {
        const place = formData.location === "gym" ? "Gym" : `Home (${formData.equipment})`;
        workoutPlan = `WORKOUT PLAN (${formData.duration} Weeks)\n`;
        workoutPlan += `Gender: ${formData.gender} | Age: ${age}\n`;
        workoutPlan += `Focus: ${planData.focus}\n`;
        workoutPlan += `Goal: ${formData.goal.replace("_", " ").toUpperCase()}\n\n`;

        if (bfpCategory === "Obese") workoutPlan += `⚠️ SAFETY: Low Impact Cardio Prescribed.\n\n`;
        workoutPlan += `ADVICE: ${planData.advice}\n\n`;
        
        // SAFETY FIX: If workout_focus is undefined, fallback to a default list
        const exList = planData.workout_focus || ["Pushups", "Squats", "Lunges", "Plank", "Jumping Jacks"]; 
        const reps = age >= 58 ? "2 sets x 10 reps" : "3 sets x 12 reps";

        // MONDAY: Primary Focus (Exercises 1 & 2 from list)
        workoutPlan += `MONDAY (Primary Strength):\n`;
        workoutPlan += `1. Warm-up: 5 mins Light Cardio\n`;
        workoutPlan += `2. ${exList[0]} (${reps})\n`;
        workoutPlan += `3. ${exList[1]} (${reps})\n`;
        workoutPlan += `4. Plank Hold (30-60s)\n`;
        workoutPlan += `5. Cool down stretch\n\n`;

        // TUESDAY: Secondary Focus (Exercises 3 & 4 from list)
        workoutPlan += `TUESDAY (Secondary/Support):\n`;
        workoutPlan += `1. Warm-up: Arm Circles/Leg Swings\n`;
        workoutPlan += `2. ${exList[2]} (${reps})\n`;
        workoutPlan += `3. ${exList[3]} (${reps})\n`;
        workoutPlan += `4. ${formData.location === 'home' ? 'Push-ups' : 'Lat Pulldowns'} (${reps})\n`;
        workoutPlan += `5. Cool down stretch\n\n`;

        // WEDNESDAY: Active Recovery
        workoutPlan += `WEDNESDAY: Active Recovery\n`;
        workoutPlan += `- 30 Mins Brisk Walking, Swimming, or Yoga.\n\n`;

        // THURSDAY: Full Body / Weak Points
        workoutPlan += `THURSDAY (Full Body & Technique):\n`;
        workoutPlan += `1. Warm-up: 5 mins\n`;
        workoutPlan += `2. ${exList[0]} (Lighter weight, focus on form)\n`;
        workoutPlan += `3. ${exList[4]} (${reps})\n`;
        workoutPlan += `4. Lunges or Step-ups (${reps})\n\n`;

        // FRIDAY: Cardio & Conditioning
        workoutPlan += `FRIDAY (Cardio & Core):\n`;
        workoutPlan += `1. ${exList[1]} (High Reps/Lower Weight)\n`;
        workoutPlan += `2. Mountain Climbers (3 x 30s)\n`;
        workoutPlan += `3. Russian Twists (3 x 20)\n`;
        workoutPlan += `4. 15 Mins Intervals (Walk/Jog)\n\n`;

        workoutPlan += `WEEKEND: Rest or Light Hobby Activity\n`;
      }

      // --- DIET ---
      if (formData.planType === "diet" || formData.planType === "both") {
        const dietLabel = formData.dietType === "non_veg" ? "Halal Non-Veg" : formData.dietType === "veg" ? "Vegetarian" : "Eggeterian";
        
        dietPlan = `7-DAY DIET MENU\n`;
        dietPlan += `Age Group: ${ageKey} | Type: ${dietLabel}\n`;
        dietPlan += `Daily Target: ~${dailyCalories} Calories\n`;
        dietPlan += `Nutritional Focus: ${planData.diet_focus}\n`;
        dietPlan += `*Strictly Halal. No Pork/Alcohol.*\n\n`;

        const specificMeals = planData.meals[formData.dietType];

        let bList = specificMeals?.breakfast || ["Oats & Fruit", "Boiled Eggs", "Toast"];
        let lList = specificMeals?.lunch || ["Vegetable Soup", "Rice & Lentils", "Sandwich"];
        let dList = specificMeals?.dinner || ["Grilled Veggies", "Stew", "Salad"];

        const shuffle = (arr: string[]) => {
            if (!arr || arr.length === 0) return [];
            return [...arr].sort(() => 0.5 - Math.random());
        };

        bList = shuffle(bList);
        lList = shuffle(lList);
        dList = shuffle(dList);

        for (let i = 0; i < 7; i++) {
            dietPlan += `DAY ${i+1}:\n`;
            dietPlan += `- Breakfast: ${bList[i % bList.length]}\n`;
            dietPlan += `- Lunch: ${lList[i % lList.length]}\n`;
            dietPlan += `- Dinner: ${dList[i % dList.length]}\n\n`;
        }
      }

      setResult({ workout: workoutPlan, diet: dietPlan });
      setStep(4);
      setLoading(false);
    }, 1000);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const lenUnit = unit === "metric" ? "cm" : "in";
    
    doc.setFontSize(22);
    doc.setTextColor(219, 39, 119);
    doc.text(`Gul's Fitness Plan`, 105, 20, { align: "center" });
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${formData.name}`, 20, 30);
    doc.text(`Gender: ${formData.gender} | Age: ${formData.age}`, 20, 36);
    doc.text(`Target Calories: ${dailyCalories} kcal/day | Goal: ${formData.goal.replace("_", " ")}`, 20, 42);
    doc.text(`Stats: ${formData.weight}kg | BMI: ${bmiValue} | BFP: ${bfp}%`, 20, 48);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Measurements: H:${formData.height}${lenUnit} | N:${formData.neck} | W:${formData.waist} | Hip:${formData.hip}`, 20, 56);

    let yPos = 65;
    const addSection = (title: string, content: string) => {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.setTextColor(219, 39, 119);
      doc.text(title, 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(content, 170);
      lines.forEach((line: string) => {
        if (yPos > 280) { doc.addPage(); yPos = 20; }
        doc.text(line, 20, yPos);
        yPos += 6;
      });
      yPos += 10;
    };

    if (result?.workout) addSection("Customized Workout Schedule", result.workout);
    if (result?.diet) addSection("Dietary Menu", result.diet);
    doc.save(`${formData.name}_Plan.pdf`);
  };

  const bgClass = darkMode ? "bg-slate-950" : "bg-rose-50";
  const cardClass = darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800";
  const textClass = darkMode ? "text-slate-100" : "text-slate-800";
  const subTextClass = darkMode ? "text-slate-400" : "text-slate-500";
  const inputClass = darkMode ? "w-full p-4 bg-slate-800 border-slate-700 rounded-2xl focus:ring-2 focus:ring-rose-500 text-white outline-none" : "w-full p-4 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-300 text-slate-800 outline-none shadow-sm";
  const btnSelectClass = (isSelected: boolean) => `p-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${isSelected ? 'border-rose-500 bg-rose-500/10 text-rose-500 shadow-md' : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bgClass} ${textClass}`}>
      <header className={`p-6 flex justify-between items-center shadow-sm sticky top-0 z-10 backdrop-blur-md ${darkMode ? "bg-slate-900/80" : "bg-white/80"}`}>
        <h1 className="text-2xl font-extrabold text-rose-500 tracking-tight">Gul's Fitness</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-110 transition">
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
        </button>
      </header>

      <main className="max-w-xl mx-auto p-6 pb-20">
        
        {step === 1 && (
          <div className={`rounded-[2rem] shadow-xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 border ${cardClass}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><User className="text-rose-500" /> Stats</h2>
              <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
                <button onClick={() => setUnit("metric")} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${unit === "metric" ? "bg-white dark:bg-slate-600 shadow text-rose-500" : "text-slate-500"}`}>CM</button>
                <button onClick={() => setUnit("imperial")} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${unit === "imperial" ? "bg-white dark:bg-slate-600 shadow text-rose-500" : "text-slate-500"}`}>INCH</button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div><label className={`block text-sm font-bold mb-2 ml-1 ${subTextClass}`}>Name</label><input name="name" type="text" placeholder="Your Name" className={inputClass} onChange={handleInputChange} /></div>
              
              <div>
                <label className={`block text-sm font-bold mb-2 ml-1 ${subTextClass}`}>Gender (Groups)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFormData({...formData, gender: 'female'})} className={btnSelectClass(formData.gender === 'female')}>Female</button>
                  <button onClick={() => setFormData({...formData, gender: 'male'})} className={btnSelectClass(formData.gender === 'male')}>Male</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Age</label><input name="age" type="number" placeholder="25" className={inputClass} onChange={handleInputChange} /></div>
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Height ({unit === 'metric' ? 'cm' : 'in'})</label><input name="height" type="number" className={inputClass} onChange={handleInputChange} /></div>
                {/* Weight is always KG */}
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Weight (kg)</label><input name="weight" type="number" placeholder="kg" className={inputClass} onChange={handleInputChange} /></div>
                
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Neck ({unit === 'metric' ? 'cm' : 'in'})</label><input name="neck" type="number" className={inputClass} onChange={handleInputChange} /></div>
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Waist ({unit === 'metric' ? 'cm' : 'in'})</label><input name="waist" type="number" className={inputClass} onChange={handleInputChange} /></div>
                <div><label className={`text-xs font-bold ml-1 mb-1 block ${subTextClass}`}>Hip ({unit === 'metric' ? 'cm' : 'in'})</label><input name="hip" type="number" className={inputClass} onChange={handleInputChange} /></div>
              </div>

              <button onClick={calculateStats} disabled={!formData.name || !formData.height || !formData.weight || !formData.age} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/30 disabled:opacity-50">
                Next Step <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && bfp !== null && (
          <div className={`rounded-[2rem] shadow-xl p-8 text-center animate-in zoom-in border ${cardClass}`}>
            <h2 className="text-3xl font-extrabold mb-2">Analysis</h2>
            <div className="my-10 relative inline-flex justify-center items-center">
              <div className="w-48 h-48 rounded-full border-[10px] border-rose-100 dark:border-rose-900 flex flex-col justify-center items-center bg-rose-500 text-white shadow-2xl">
                <span className="text-5xl font-extrabold">{bfp}%</span>
                <span className="text-xs uppercase font-bold tracking-widest mt-1 opacity-90">Body Fat</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-8">
              <div className={`text-center p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="text-xs text-slate-500 uppercase font-bold">BMI</div>
                <div className="text-lg font-bold">{bmiValue}</div>
              </div>
              <div className={`text-center p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="text-xs text-slate-500 uppercase font-bold">Class</div>
                <div className="text-lg font-bold text-rose-500 leading-tight">{bfpCategory}</div>
              </div>
              <div className={`text-center p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="text-xs text-slate-500 uppercase font-bold">Calories</div>
                <div className="text-lg font-bold flex items-center justify-center gap-1 text-orange-500">
                  <Flame size={14} /> {dailyCalories}
                </div>
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-xl">
              Build Plan <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className={`rounded-[2rem] shadow-xl p-6 sm:p-8 animate-in fade-in slide-in-from-right-4 border ${cardClass}`}>
            <h2 className="text-2xl font-bold mb-6">Customize</h2>
            <div className="space-y-8">
              <div><label className={`block text-sm font-bold mb-3 ${subTextClass}`}>I want a...</label><div className="grid grid-cols-1 gap-3"><button onClick={() => setFormData({...formData, planType: 'both'})} className={btnSelectClass(formData.planType === 'both')}>Workout + Diet (Recommended)</button><div className="grid grid-cols-2 gap-3"><button onClick={() => setFormData({...formData, planType: 'workout'})} className={btnSelectClass(formData.planType === 'workout')}>Workout Only</button><button onClick={() => setFormData({...formData, planType: 'diet'})} className={btnSelectClass(formData.planType === 'diet')}>Diet Only</button></div></div></div>
              <div><label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${subTextClass}`}><Calendar size={16} /> Duration (Weeks)</label><div className="grid grid-cols-4 gap-2">{['1', '2', '3', '4'].map((wk) => (<button key={wk} onClick={() => setFormData({...formData, duration: wk as Duration})} className={btnSelectClass(formData.duration === wk)}>{wk} Wk</button>))}</div></div>
              <div><label className={`block text-sm font-bold mb-3 flex items-center gap-2 ${subTextClass}`}><Target size={16} /> Goal</label><div className="grid grid-cols-1 gap-3"><button onClick={() => setFormData({...formData, goal: 'lose_weight'})} className={btnSelectClass(formData.goal === 'lose_weight')}><Flame className="text-orange-500" size={18} /> Lose Weight</button><button onClick={() => setFormData({...formData, goal: 'tone'})} className={btnSelectClass(formData.goal === 'tone')}><Activity className="text-blue-500" size={18} /> Tone & Maintain</button><button onClick={() => setFormData({...formData, goal: 'gain_weight'})} className={btnSelectClass(formData.goal === 'gain_weight')}><Dumbbell className="text-green-500" size={18} /> Build Muscle</button></div></div>
              {(formData.planType === 'workout' || formData.planType === 'both') && (<div><label className={`block text-sm font-bold mb-3 ${subTextClass}`}>Location & Equipment</label><div className="grid grid-cols-1 gap-3"><button onClick={() => setFormData({...formData, location: 'gym'})} className={btnSelectClass(formData.location === 'gym')}>Gym (Full Equipment)</button><div className="grid grid-cols-2 gap-3"><button onClick={() => {setFormData({...formData, location: 'home', equipment: 'dumbbells'})}} className={btnSelectClass(formData.location === 'home' && formData.equipment === 'dumbbells')}>Home (Dumbbells)</button><button onClick={() => {setFormData({...formData, location: 'home', equipment: 'bodyweight'})}} className={btnSelectClass(formData.location === 'home' && formData.equipment === 'bodyweight')}>Home (No Equip)</button></div></div></div>)}
              {(formData.planType === 'diet' || formData.planType === 'both') && (<div><label className={`block text-sm font-bold mb-3 ${subTextClass}`}>Diet Type</label><div className="grid grid-cols-1 gap-3"><button onClick={() => setFormData({...formData, dietType: 'non_veg'})} className={btnSelectClass(formData.dietType === 'non_veg')}>Non-Veg (Halal)</button><div className="grid grid-cols-2 gap-3"><button onClick={() => setFormData({...formData, dietType: 'veg'})} className={btnSelectClass(formData.dietType === 'veg')}>Vegetarian</button><button onClick={() => setFormData({...formData, dietType: 'egg'})} className={btnSelectClass(formData.dietType === 'egg')}>Eggetarian</button></div></div></div>)}
              <button onClick={generatePlan} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/30">{loading ? "Generating..." : "Generate Final Plan"}</button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className={`rounded-[2rem] shadow-xl p-8 mb-6 text-center border ${cardClass}`}>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"><CheckCircle size={32} /></div>
              <h2 className="text-2xl font-bold">Plan Ready!</h2>
              <p className={subTextClass}>Customized for {formData.name} ({formData.gender}, {formData.age}yo)</p>
              <button onClick={downloadPDF} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl mt-6 flex items-center justify-center gap-2 transition shadow-lg shadow-rose-500/30"><Download size={20} /> Download PDF Plan</button>
            </div>
            <div className="grid gap-4">
              {result.workout && (<div className={`p-6 rounded-2xl shadow-sm border ${cardClass}`}><h3 className="font-bold text-rose-500 flex items-center gap-2 mb-3"><BicepsFlexed size={20} /> Workout Preview</h3><div className={`text-sm whitespace-pre-line leading-relaxed ${subTextClass}`}>{result.workout}</div></div>)}
              {result.diet && (<div className={`p-6 rounded-2xl shadow-sm border ${cardClass}`}><h3 className="font-bold text-rose-500 flex items-center gap-2 mb-3"><Utensils size={20} /> Diet Preview</h3><div className={`text-sm whitespace-pre-line leading-relaxed ${subTextClass}`}>{result.diet}</div></div>)}
            </div>
            <button onClick={() => { setStep(1); setResult(null); }} className="w-full text-slate-400 font-semibold py-6 text-sm hover:text-rose-500 transition mt-4">Start Over</button>
          </div>
        )}
      </main>
    </div>
  );
}