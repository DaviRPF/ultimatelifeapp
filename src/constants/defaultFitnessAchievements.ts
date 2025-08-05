import { DefaultAchievement } from '../types';

export const DEFAULT_FITNESS_ACHIEVEMENTS: DefaultAchievement[] = [
  // Fitness Default Category - Weight & Body Composition
  {
    id: 'first_weigh_in',
    title: '⚖️ O Primeiro Passo',
    description: 'Registre seu primeiro peso - toda jornada começa com uma medida',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'weight_lost', target: 0, unit: 'kg' }
  },
  {
    id: 'weight_warrior_5kg',
    title: '🏃‍♂️ Guerreiro dos 5kg',
    description: 'Perca ou ganhe 5kg - você dominou a balança!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'weight_lost', target: 5, unit: 'kg' }
  },
  {
    id: 'transformation_master',
    title: '🦾 Mestre da Transformação',
    description: 'Perca ou ganhe 10kg - sua dedicação é inspiradora!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'weight_lost', target: 10, unit: 'kg' }
  },
  {
    id: 'body_architect',
    title: '🏗️ Arquiteto do Corpo',
    description: 'Perca ou ganhe 20kg - você reconstruiu seu templo!',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'weight_lost', target: 20, unit: 'kg' }
  },

  // Bench Press Achievements
  {
    id: 'bench_novice',
    title: '💪 Novato do Supino',
    description: 'Supino com 50kg - você quebrou a barreira inicial!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'max_bench_press', target: 50, unit: 'kg' }
  },
  {
    id: 'plate_pusher',
    title: '🏋️‍♀️ Empurrador de Anilhas',
    description: 'Supino com 80kg - as anilhas tremem na sua presença!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'max_bench_press', target: 80, unit: 'kg' }
  },
  {
    id: 'century_crusher',
    title: '💥 Destruidor de Século',
    description: 'Supino com 100kg - você entrou no clube dos três dígitos!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'max_bench_press', target: 100, unit: 'kg' }
  },
  {
    id: 'iron_titan',
    title: '⚡ Titã de Ferro',
    description: 'Supino com 150kg - você é uma força da natureza!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'max_bench_press', target: 150, unit: 'kg' }
  },
  {
    id: 'chest_god',
    title: '👑 Deus do Peitoral',
    description: 'Supino com 200kg - mortais se curvam diante do seu poder!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'max_bench_press', target: 200, unit: 'kg' }
  },

  // Squat Achievements
  {
    id: 'squat_starter',
    title: '🦵 Iniciante dos Agachamentos',
    description: 'Agachamento com 80kg - suas pernas despertaram!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'max_squat', target: 80, unit: 'kg' }
  },
  {
    id: 'leg_thunder',
    title: '⚡ Trovão das Pernas',
    description: 'Agachamento com 120kg - o chão treme quando você desce!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'max_squat', target: 120, unit: 'kg' }
  },
  {
    id: 'quad_crusher',
    title: '🔥 Triturador de Quadríceps',
    description: 'Agachamento com 160kg - suas coxas são canhões!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'max_squat', target: 160, unit: 'kg' }
  },
  {
    id: 'squat_monster',
    title: '👹 Monstro dos Agachamentos',
    description: 'Agachamento com 200kg - você é uma máquina de potência!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'max_squat', target: 200, unit: 'kg' }
  },
  {
    id: 'leg_emperor',
    title: '👑 Imperador das Pernas',
    description: 'Agachamento com 250kg - você reina supremo!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'max_squat', target: 250, unit: 'kg' }
  },

  // Deadlift Achievements
  {
    id: 'deadlift_awakening',
    title: '💀 Despertar do Levantamento',
    description: 'Levantamento terra com 100kg - você acordou o gigante interior!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'max_deadlift', target: 100, unit: 'kg' }
  },
  {
    id: 'ground_ripper',
    title: '🌪️ Rasgador do Chão',
    description: 'Levantamento terra com 150kg - você arranca o peso da terra!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'max_deadlift', target: 150, unit: 'kg' }
  },
  {
    id: 'gravity_defier',  
    title: '🚀 Desafiador da Gravidade',
    description: 'Levantamento terra com 200kg - a gravidade é sua inimiga derrotada!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'max_deadlift', target: 200, unit: 'kg' }
  },
  {
    id: 'earth_mover',
    title: '🏔️ Movedor de Montanhas',
    description: 'Levantamento terra com 250kg - você move a própria terra!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'max_deadlift', target: 250, unit: 'kg' }
  },
  {
    id: 'deadlift_legend',
    title: '⚡ Lenda do Levantamento',
    description: 'Levantamento terra com 300kg - você transcendeu os limites mortais!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'max_deadlift', target: 300, unit: 'kg' }
  },

  // Total Weight Lifted Achievements
  {
    id: 'ton_crusher',
    title: '🚛 Esmagador de Toneladas',
    description: 'Levante 1 tonelada no total - você é uma máquina de força!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'total_weight_lifted', target: 1000, unit: 'kg' }
  },
  {
    id: 'freight_train',
    title: '🚂 Trem de Carga',
    description: 'Levante 5 toneladas no total - você move cargas industriais!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'total_weight_lifted', target: 5000, unit: 'kg' }
  },
  {
    id: 'crane_operator',
    title: '🏗️ Operador de Guindaste',
    description: 'Levante 10 toneladas no total - você é um guindaste humano!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'total_weight_lifted', target: 10000, unit: 'kg' }
  },
  {
    id: 'atlas_reborn',
    title: '🌍 Atlas Renascido',
    description: 'Levante 25 toneladas no total - você carrega o mundo nas costas!',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'total_weight_lifted', target: 25000, unit: 'kg' }
  },
  {
    id: 'weight_god',
    title: '⚡ Deus dos Pesos',
    description: 'Levante 50 toneladas no total - você transcendeu a física!',
    unlocked: false,
    xpMultiplier: 1.35,
    condition: { type: 'total_weight_lifted', target: 50000, unit: 'kg' }
  },

  // Body Measurements - Arms
  {
    id: 'gun_show_40',
    title: '💪 Show dos Canhões 40cm',
    description: 'Braço contraído de 40cm - você tem artilharia pesada!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'body_measurement', target: 40, measurementType: 'bracoContraido', unit: 'cm' }
  },
  {
    id: 'bicep_warrior_45',
    title: '⚔️ Guerreiro Bíceps 45cm',
    description: 'Braço contraído de 45cm - suas armas são lendárias!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'body_measurement', target: 45, measurementType: 'bracoContraido', unit: 'cm' }
  },
  {
    id: 'arm_titan_50',
    title: '🦾 Titã dos Braços 50cm',
    description: 'Braço contraído de 50cm - você redefiniu o que são músculos!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'body_measurement', target: 50, measurementType: 'bracoContraido', unit: 'cm' }
  },

  // Body Measurements - Legs
  {
    id: 'thunder_thighs_60',
    title: '⚡ Coxas de Trovão 60cm',
    description: 'Perna de 60cm - você tem troncos de árvore como pernas!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'body_measurement', target: 60, measurementType: 'perna', unit: 'cm' }
  },
  {
    id: 'quad_destroyer_65',
    title: '🔥 Destruidor Quads 65cm',
    description: 'Perna de 65cm - suas coxas são pilares de poder!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'body_measurement', target: 65, measurementType: 'perna', unit: 'cm' }
  },
  {
    id: 'leg_colossus_70',
    title: '🏛️ Colosso das Pernas 70cm',
    description: 'Perna de 70cm - você caminha sobre pilares de mármore!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'body_measurement', target: 70, measurementType: 'perna', unit: 'cm' }
  },

  // Workout Frequency
  {
    id: 'gym_rookie',
    title: '🏃‍♂️ Novato da Academia',
    description: 'Complete 10 treinos - você pegou o ritmo!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'workout_count', target: 10, unit: 'treinos' }
  },
  {
    id: 'fitness_addict',
    title: '💊 Viciado em Fitness',
    description: 'Complete 50 treinos - o ferro virou seu melhor amigo!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'workout_count', target: 50, unit: 'treinos' }
  },
  {
    id: 'gym_veteran',
    title: '🎖️ Veterano da Academia',
    description: 'Complete 100 treinos - você é uma lenda do templo do ferro!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'workout_count', target: 100, unit: 'treinos' }
  },
  {
    id: 'iron_pilgrim',
    title: '⛩️ Peregrino do Ferro',
    description: 'Complete 250 treinos - sua devoção é inabalável!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'workout_count', target: 250, unit: 'treinos' }
  },
  {
    id: 'fitness_immortal',
    title: '👑 Imortal do Fitness',
    description: 'Complete 500 treinos - você alcançou a imortalidade física!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'workout_count', target: 500, unit: 'treinos' }
  },

  // Cardio Achievements
  {
    id: 'cardio_starter',
    title: '❤️ Iniciante Cardio',
    description: 'Complete 60 minutos de cardio - seu coração agradece!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'cardio_minutes', target: 60, unit: 'min' }
  },
  {
    id: 'heart_warrior',
    title: '💓 Guerreiro do Coração',
    description: 'Complete 300 minutos de cardio - 5 horas de pura resistência!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'cardio_minutes', target: 300, unit: 'min' }
  },
  {
    id: 'endurance_beast',
    title: '🦬 Fera da Resistência',
    description: 'Complete 600 minutos de cardio - 10 horas de poder cardiovascular!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'cardio_minutes', target: 600, unit: 'min' }
  },
  {
    id: 'marathon_machine',
    title: '🏃‍♀️ Máquina de Maratona',
    description: 'Complete 1200 minutos de cardio - você é imparável!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'cardio_minutes', target: 1200, unit: 'min' }
  },
  {
    id: 'cardio_legend',
    title: '⚡ Lenda do Cardio',
    description: 'Complete 2400 minutos de cardio - 40 horas de pura determinação!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'cardio_minutes', target: 2400, unit: 'min' }
  },

  // Body Measurements - INICIANTES (circunferências menores)
  {
    id: 'first_measurement',
    title: '📏 Primeira Medição',
    description: 'Registre suas primeiras medidas corporais - conhecimento é poder!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'body_measurement', target: 1, measurementType: 'bracoRelaxado', unit: 'cm' }
  },
  {
    id: 'bicep_beginner_30',
    title: '💪 Bíceps Iniciante 30cm',
    description: 'Braço contraído de 30cm - toda jornada tem um começo!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'body_measurement', target: 30, measurementType: 'bracoContraido', unit: 'cm' }
  },
  {
    id: 'bicep_progress_35',
    title: '🚀 Progresso Bíceps 35cm',
    description: 'Braço contraído de 35cm - você está crescendo!',
    unlocked: false,
    xpMultiplier: 1.08,
    condition: { type: 'body_measurement', target: 35, measurementType: 'bracoContraido', unit: 'cm' }
  },
  {
    id: 'leg_starter_50',
    title: '🦵 Iniciante Pernas 50cm',
    description: 'Perna de 50cm - suas pernas estão despertando!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'body_measurement', target: 50, measurementType: 'perna', unit: 'cm' }
  },
  {
    id: 'leg_growing_55',
    title: '🌱 Pernas Crescendo 55cm',
    description: 'Perna de 55cm - o crescimento é visível!',
    unlocked: false,
    xpMultiplier: 1.08,
    condition: { type: 'body_measurement', target: 55, measurementType: 'perna', unit: 'cm' }
  },
  {
    id: 'chest_beginner_90',
    title: '🏠 Peitoral Iniciante 90cm',
    description: 'Peitoral de 90cm - você está construindo sua base!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'body_measurement', target: 90, measurementType: 'peitoral', unit: 'cm' }
  },
  {
    id: 'chest_expanding_95',
    title: '📈 Peitoral Expandindo 95cm',
    description: 'Peitoral de 95cm - sua caixa torácica está crescendo!',
    unlocked: false,
    xpMultiplier: 1.08,
    condition: { type: 'body_measurement', target: 95, measurementType: 'peitoral', unit: 'cm' }
  },

  // Treinos Consecutivos
  {
    id: 'consistency_warrior_3',
    title: '🔥 Guerreiro da Consistência',
    description: '3 treinos consecutivos - a disciplina está nascendo!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'consecutive_workouts', target: 3, unit: 'dias' }
  },
  {
    id: 'habit_builder_7',
    title: '🏗️ Construtor de Hábitos',
    description: '7 treinos consecutivos - uma semana de dedicação!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'consecutive_workouts', target: 7, unit: 'dias' }
  },
  {
    id: 'unstoppable_force_14',
    title: '⚡ Força Imparável',
    description: '14 treinos consecutivos - duas semanas de poder!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'consecutive_workouts', target: 14, unit: 'dias' }
  },
  {
    id: 'iron_will_21',
    title: '🛡️ Vontade de Ferro',
    description: '21 treinos consecutivos - você formou um hábito!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'consecutive_workouts', target: 21, unit: 'dias' }
  },
  {
    id: 'monthly_machine_30',
    title: '🤖 Máquina Mensal',
    description: '30 treinos consecutivos - um mês inteiro de dedicação!',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'consecutive_workouts', target: 30, unit: 'dias' }
  },
  {
    id: 'relentless_beast_60',
    title: '👹 Fera Implacável',
    description: '60 treinos consecutivos - dois meses sem parar!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'consecutive_workouts', target: 60, unit: 'dias' }
  },
  {
    id: 'legendary_commitment_90',
    title: '👑 Comprometimento Lendário',
    description: '90 treinos consecutivos - três meses de lenda!',
    unlocked: false,
    xpMultiplier: 1.4,
    condition: { type: 'consecutive_workouts', target: 90, unit: 'dias' }
  },

  // Exercícios Específicos - Flexões
  {
    id: 'first_pushup',
    title: '👶 Primeira Flexão',
    description: 'Complete sua primeira flexão - todo gigante começa pequeno!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'flexao_count', target: 1, unit: 'reps' }
  },
  {
    id: 'pushup_starter_10',
    title: '💪 Flexionador Iniciante',
    description: '10 flexões no total - você pegou o jeito!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'flexao_count', target: 10, unit: 'reps' }
  },
  {
    id: 'pushup_warrior_50',
    title: '⚔️ Guerreiro das Flexões',
    description: '50 flexões no total - suas flexões são suas armas!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'flexao_count', target: 50, unit: 'reps' }
  },
  {
    id: 'pushup_centurion_100',
    title: '🏛️ Centurião das Flexões',
    description: '100 flexões no total - você comanda um exército de músculos!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'flexao_count', target: 100, unit: 'reps' }
  },
  {
    id: 'pushup_machine_500',
    title: '🤖 Máquina de Flexões',
    description: '500 flexões no total - você é uma máquina de potência!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'flexao_count', target: 500, unit: 'reps' }
  },
  {
    id: 'pushup_legend_1000',
    title: '⚡ Lenda das Flexões',
    description: '1000 flexões no total - você transcendeu os limites!',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'flexao_count', target: 1000, unit: 'reps' }
  },

  // Exercícios Específicos - Barra Fixa
  {
    id: 'first_pullup',
    title: '🎯 Primeira Barra',
    description: 'Complete sua primeira barra fixa - você venceu a gravidade!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'barra_fixa_count', target: 1, unit: 'reps' }
  },
  {
    id: 'pullup_rookie_5',
    title: '🌟 Novato da Barra',
    description: '5 barras no total - você está dominando seu peso corporal!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'barra_fixa_count', target: 5, unit: 'reps' }
  },
  {
    id: 'pullup_climber_25',
    title: '🧗‍♂️ Escalador',
    description: '25 barras no total - você escala montanhas de músculos!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'barra_fixa_count', target: 25, unit: 'reps' }
  },
  {
    id: 'pullup_master_100',
    title: '🎖️ Mestre da Barra',
    description: '100 barras no total - você domina completamente seu corpo!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'barra_fixa_count', target: 100, unit: 'reps' }
  },
  {
    id: 'pullup_titan_250',
    title: '🏔️ Titã da Barra',
    description: '250 barras no total - você move montanhas com as costas!',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'barra_fixa_count', target: 250, unit: 'reps' }
  },
  {
    id: 'pullup_god_500',
    title: '👑 Deus da Barra Fixa',
    description: '500 barras no total - você redefiniu o que é possível!',
    unlocked: false,
    xpMultiplier: 1.35,
    condition: { type: 'barra_fixa_count', target: 500, unit: 'reps' }
  },

  // Exercícios Específicos - Rosca Direta
  {
    id: 'curl_apprentice_20kg',
    title: '💪 Aprendiz da Rosca',
    description: 'Rosca direta com 20kg - seus bíceps estão acordando!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'exercise_max_weight', target: 20, exerciseName: 'rosca-direta-barra', unit: 'kg' }
  },
  {
    id: 'curl_warrior_40kg',
    title: '⚔️ Guerreiro da Rosca',
    description: 'Rosca direta com 40kg - seus braços são espadas!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'exercise_max_weight', target: 40, exerciseName: 'rosca-direta-barra', unit: 'kg' }
  },
  {
    id: 'curl_master_60kg',
    title: '🎯 Mestre da Rosca',
    description: 'Rosca direta com 60kg - você forjou braços de aço!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'exercise_max_weight', target: 60, exerciseName: 'rosca-direta-barra', unit: 'kg' }
  },

  // Exercícios Específicos - Desenvolvimento Militar
  {
    id: 'ohp_starter_30kg',
    title: '🎖️ Soldado Iniciante',
    description: 'Desenvolvimento militar com 30kg - você entrou no exército!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'exercise_max_weight', target: 30, exerciseName: 'desenvolvimento-militar', unit: 'kg' }
  },
  {
    id: 'ohp_sergeant_50kg',
    title: '⭐ Sargento',
    description: 'Desenvolvimento militar com 50kg - você foi promovido!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'exercise_max_weight', target: 50, exerciseName: 'desenvolvimento-militar', unit: 'kg' }
  },
  {
    id: 'ohp_captain_70kg',
    title: '🎖️ Capitão dos Ombros',
    description: 'Desenvolvimento militar com 70kg - você comanda a tropa!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'exercise_max_weight', target: 70, exerciseName: 'desenvolvimento-militar', unit: 'kg' }
  },
  {
    id: 'ohp_general_100kg',
    title: '⭐⭐⭐ General dos Ombros',
    description: 'Desenvolvimento militar com 100kg - você é o comandante supremo!',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'exercise_max_weight', target: 100, exerciseName: 'desenvolvimento-militar', unit: 'kg' }
  },

  // Exercícios de Peso Corporal - Total de Repetições
  {
    id: 'burpee_survivor_50',
    title: '🔥 Sobrevivente dos Burpees',
    description: '50 burpees no total - você sobreviveu ao inferno!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'exercise_total_reps', target: 50, exerciseName: 'burpee', unit: 'reps' }
  },
  {
    id: 'burpee_warrior_200',
    title: '⚡ Guerreiro dos Burpees',
    description: '200 burpees no total - você domina o caos!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'exercise_total_reps', target: 200, exerciseName: 'burpee', unit: 'reps' }
  },
  {
    id: 'burpee_legend_500',
    title: '👑 Lenda dos Burpees',
    description: '500 burpees no total - você é imparável!',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'exercise_total_reps', target: 500, exerciseName: 'burpee', unit: 'reps' }
  },

  // Planks e Core
  {
    id: 'plank_beginner_60s',
    title: '🏠 Construtor de Base',
    description: 'Prancha por 60 segundos - você construiu sua base!',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'exercise_total_reps', target: 60, exerciseName: 'prancha', unit: 'segundos' }
  },
  {
    id: 'plank_warrior_300s',
    title: '🛡️ Guerreiro da Prancha',
    description: 'Prancha por 300 segundos - 5 minutos de poder!',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'exercise_total_reps', target: 300, exerciseName: 'prancha', unit: 'segundos' }
  },
  {
    id: 'plank_master_600s',
    title: '⚡ Mestre da Prancha',
    description: 'Prancha por 600 segundos - 10 minutos de força pura!',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'exercise_total_reps', target: 600, exerciseName: 'prancha', unit: 'segundos' }
  }
];