import { Exercise } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // PEITO (25 exercícios)
  {
    id: 'supino-reto-barra',
    name: 'Supino Reto com Barra',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Tríceps', 'Deltoides Anterior'],
    equipment: 'Barra',
    instructions: 'Deite no banco, posicione a barra na altura do peito, empurre para cima controladamente.'
  },
  {
    id: 'supino-reto-halteres',
    name: 'Supino Reto com Halteres',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Tríceps', 'Deltoides Anterior'],
    equipment: 'Halteres',
    instructions: 'Use halteres para maior amplitude de movimento no supino reto.'
  },
  {
    id: 'supino-inclinado-barra',
    name: 'Supino Inclinado com Barra',
    category: 'chest',
    muscleGroups: ['Peitoral Superior', 'Deltoides Anterior', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Banco inclinado 30-45°, mesma execução do supino reto.'
  },
  {
    id: 'supino-inclinado-halteres',
    name: 'Supino Inclinado com Halteres',
    category: 'chest',
    muscleGroups: ['Peitoral Superior', 'Deltoides Anterior', 'Tríceps'],
    equipment: 'Halteres',
    instructions: 'Supino inclinado com halteres para maior amplitude.'
  },
  {
    id: 'supino-declinado-barra',
    name: 'Supino Declinado com Barra',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Banco declinado, foque na parte inferior do peitoral.'
  },
  {
    id: 'supino-declinado-halteres',
    name: 'Supino Declinado com Halteres',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior', 'Tríceps'],
    equipment: 'Halteres',
    instructions: 'Supino declinado com halteres.'
  },
  {
    id: 'crucifixo-reto',
    name: 'Crucifixo Reto',
    category: 'chest',
    muscleGroups: ['Peitoral Maior'],
    equipment: 'Halteres',
    instructions: 'Movimento em arco, foque no alongamento e contração do peitoral.'
  },
  {
    id: 'crucifixo-inclinado',
    name: 'Crucifixo Inclinado',
    category: 'chest',
    muscleGroups: ['Peitoral Superior'],
    equipment: 'Halteres',
    instructions: 'Crucifixo em banco inclinado.'
  },
  {
    id: 'crucifixo-declinado',
    name: 'Crucifixo Declinado',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior'],
    equipment: 'Halteres',
    instructions: 'Crucifixo em banco declinado.'
  },
  {
    id: 'fly-pec-deck',
    name: 'Fly no Pec Deck',
    category: 'chest',
    muscleGroups: ['Peitoral Maior'],
    equipment: 'Máquina',
    instructions: 'Movimento de adução dos braços na máquina pec deck.'
  },
  {
    id: 'cross-over-alto',
    name: 'Cross Over Alto',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior'],
    equipment: 'Cabo',
    instructions: 'Puxada de cabos de cima para baixo.'
  },
  {
    id: 'cross-over-medio',
    name: 'Cross Over Médio',
    category: 'chest',
    muscleGroups: ['Peitoral Maior'],
    equipment: 'Cabo',
    instructions: 'Puxada de cabos na altura do peito.'
  },
  {
    id: 'cross-over-baixo',
    name: 'Cross Over Baixo',
    category: 'chest',
    muscleGroups: ['Peitoral Superior'],
    equipment: 'Cabo',
    instructions: 'Puxada de cabos de baixo para cima.'
  },
  {
    id: 'flexao-tradicional',
    name: 'Flexão Tradicional',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Tríceps', 'Core'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão de braços tradicional.'
  },
  {
    id: 'flexao-inclinada',
    name: 'Flexão Inclinada',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão com pés elevados.'
  },
  {
    id: 'flexao-declinada',
    name: 'Flexão Declinada',
    category: 'chest',
    muscleGroups: ['Peitoral Superior', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão com mãos elevadas.'
  },
  {
    id: 'flexao-diamante',
    name: 'Flexão Diamante',
    category: 'chest',
    muscleGroups: ['Peitoral Interno', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão com mãos formando um diamante.'
  },
  {
    id: 'supino-maquina',
    name: 'Supino na Máquina',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Tríceps'],
    equipment: 'Máquina',
    instructions: 'Supino executado na máquina.'
  },
  {
    id: 'pullover-halteres',
    name: 'Pullover com Halteres',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Serrátil'],
    equipment: 'Halteres',
    instructions: 'Movimento de pullover com halter.'
  },
  {
    id: 'pullover-barra',
    name: 'Pullover com Barra',
    category: 'chest',
    muscleGroups: ['Peitoral Maior', 'Serrátil'],
    equipment: 'Barra',
    instructions: 'Movimento de pullover com barra.'
  },
  {
    id: 'paralelas-peito',
    name: 'Paralelas para Peito',
    category: 'chest',
    muscleGroups: ['Peitoral Inferior', 'Tríceps'],
    equipment: 'Paralelas',
    instructions: 'Paralelas inclinando o corpo para frente.'
  },
  {
    id: 'supino-guilhotina',
    name: 'Supino Guilhotina',
    category: 'chest',
    muscleGroups: ['Peitoral Maior'],
    equipment: 'Barra',
    instructions: 'Supino com a barra descendo até o pescoço.'
  },
  {
    id: 'supino-pegada-fechada-peito',
    name: 'Supino Pegada Fechada (Peito)',
    category: 'chest',
    muscleGroups: ['Peitoral Interno', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Supino com pegada mais fechada focando no peito.'
  },
  {
    id: 'landmine-press',
    name: 'Landmine Press',
    category: 'chest',
    muscleGroups: ['Peitoral Superior', 'Core'],
    equipment: 'Barra',
    instructions: 'Pressão com barra ancorada no chão.'
  },
  {
    id: 'svend-press',
    name: 'Svend Press',
    category: 'chest',
    muscleGroups: ['Peitoral Interno'],
    equipment: 'Anilhas',
    instructions: 'Compressão de anilhas à frente do peito.'
  },
  
  // COSTAS (25 exercícios)
  {
    id: 'levantamento-terra',
    name: 'Levantamento Terra',
    category: 'back',
    muscleGroups: ['Eretores da Espinha', 'Glúteos', 'Posteriores de Coxa', 'Latíssimo'],
    equipment: 'Barra',
    instructions: 'Pés na largura dos ombros, mantenha a coluna neutra, puxe com as pernas.'
  },
  {
    id: 'levantamento-terra-sumo',
    name: 'Levantamento Terra Sumo',
    category: 'back',
    muscleGroups: ['Eretores da Espinha', 'Glúteos', 'Adutores'],
    equipment: 'Barra',
    instructions: 'Pés mais afastados, pegada mais estreita.'
  },
  {
    id: 'barra-fixa-pronada',
    name: 'Barra Fixa Pronada',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps', 'Romboides'],
    equipment: 'Barra Fixa',
    instructions: 'Pegada pronada, puxe o corpo até o queixo passar da barra.'
  },
  {
    id: 'barra-fixa-supinada',
    name: 'Barra Fixa Supinada',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps'],
    equipment: 'Barra Fixa',
    instructions: 'Pegada supinada, enfatiza mais os bíceps.'
  },
  {
    id: 'barra-fixa-neutra',
    name: 'Barra Fixa Neutra',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps'],
    equipment: 'Barra Fixa',
    instructions: 'Pegada neutra nas barras paralelas.'
  },
  {
    id: 'puxada-alta-frente',
    name: 'Puxada Alta pela Frente',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps'],
    equipment: 'Cabo',
    instructions: 'Puxe a barra em direção ao peito, foque na contração do dorso.'
  },
  {
    id: 'puxada-alta-nuca',
    name: 'Puxada Alta pela Nuca',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Trapézio'],
    equipment: 'Cabo',
    instructions: 'Puxada pela nuca, cuidado com a flexibilidade.'
  },
  {
    id: 'remada-curvada-barra',
    name: 'Remada Curvada com Barra',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides', 'Trapézio Médio'],
    equipment: 'Barra',
    instructions: 'Incline o tronco, puxe a barra em direção ao abdômen.'
  },
  {
    id: 'remada-curvada-halteres',
    name: 'Remada Curvada com Halteres',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides'],
    equipment: 'Halteres',
    instructions: 'Remada curvada com halteres.'
  },
  {
    id: 'remada-unilateral',
    name: 'Remada Unilateral',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides'],
    equipment: 'Halteres',
    instructions: 'Remada com um braço apoiado no banco.'
  },
  {
    id: 'remada-sentada',
    name: 'Remada Sentada',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides', 'Trapézio'],
    equipment: 'Cabo',
    instructions: 'Puxe o cabo em direção ao abdômen, ombros para trás.'
  },
  {
    id: 'remada-baixa',
    name: 'Remada Baixa',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides'],
    equipment: 'Cabo',
    instructions: 'Remada em pé com cabo baixo.'
  },
  {
    id: 'remada-cavalinho',
    name: 'Remada Cavalinho',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Deltoides Posterior'],
    equipment: 'Máquina',
    instructions: 'Remada apoiado no peito da máquina.'
  },
  {
    id: 'remada-t-bar',
    name: 'Remada T-Bar',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides'],
    equipment: 'T-Bar',
    instructions: 'Remada com barra T.'
  },
  {
    id: 'pull-down-pegada-fechada',
    name: 'Pull Down Pegada Fechada',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps'],
    equipment: 'Cabo',
    instructions: 'Puxada com pegada mais fechada.'
  },
  {
    id: 'pull-down-triângulo',
    name: 'Pull Down Triângulo',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Bíceps'],
    equipment: 'Cabo',
    instructions: 'Puxada com barra triângulo.'
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    category: 'back',
    muscleGroups: ['Deltoides Posterior', 'Trapézio Médio'],
    equipment: 'Cabo',
    instructions: 'Puxada do cabo em direção ao rosto.'
  },
  {
    id: 'encolhimento-barra',
    name: 'Encolhimento com Barra',
    category: 'back',
    muscleGroups: ['Trapézio Superior'],
    equipment: 'Barra',
    instructions: 'Encolhimento dos ombros com barra.'
  },
  {
    id: 'encolhimento-halteres',
    name: 'Encolhimento com Halteres',
    category: 'back',
    muscleGroups: ['Trapézio Superior'],
    equipment: 'Halteres',
    instructions: 'Encolhimento dos ombros com halteres.'
  },
  {
    id: 'good-morning',
    name: 'Good Morning',
    category: 'back',
    muscleGroups: ['Eretores da Espinha', 'Posteriores'],
    equipment: 'Barra',
    instructions: 'Flexão do quadril com barra nas costas.'
  },
  {
    id: 'hiperextensao',
    name: 'Hiperextensão',
    category: 'back',
    muscleGroups: ['Eretores da Espinha', 'Glúteos'],
    equipment: 'Banco',
    instructions: 'Extensão do tronco no banco 45°.'
  },
  {
    id: 'superman',
    name: 'Superman',
    category: 'back',
    muscleGroups: ['Eretores da Espinha'],
    equipment: 'Peso Corporal',
    instructions: 'Elevação simultânea de braços e pernas deitado.'
  },
  {
    id: 'muscle-up',
    name: 'Muscle Up',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Peitorais', 'Tríceps'],
    equipment: 'Barra Fixa',
    instructions: 'Movimento combinado de barra e fundo.'
  },
  {
    id: 'rack-pull',
    name: 'Rack Pull',
    category: 'back',
    muscleGroups: ['Eretores da Espinha', 'Trapézio'],
    equipment: 'Barra',
    instructions: 'Levantamento terra parcial no rack.'
  },
  {
    id: 'seal-row',
    name: 'Seal Row',
    category: 'back',
    muscleGroups: ['Latíssimo do Dorso', 'Romboides'],
    equipment: 'Barra',
    instructions: 'Remada deitado em banco.'
  },
  
  // OMBROS (35 exercícios)
  {
    id: 'desenvolvimento-militar',
    name: 'Desenvolvimento Militar',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Empurre a barra acima da cabeça em pé.'
  },
  {
    id: 'desenvolvimento-sentado',
    name: 'Desenvolvimento Sentado',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Halteres',
    instructions: 'Desenvolvimento sentado no banco.'
  },
  {
    id: 'desenvolvimento-arnold',
    name: 'Desenvolvimento Arnold',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Halteres',
    instructions: 'Desenvolvimento com rotação dos halteres.'
  },
  {
    id: 'desenvolvimento-por-tras',
    name: 'Desenvolvimento por Trás',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Desenvolvimento com barra por trás da cabeça.'
  },
  {
    id: 'elevacao-lateral',
    name: 'Elevação Lateral',
    category: 'shoulders',
    muscleGroups: ['Deltoides Médio'],
    equipment: 'Halteres',
    instructions: 'Eleve os braços lateralmente até a altura dos ombros.'
  },
  {
    id: 'elevacao-lateral-cabo',
    name: 'Elevação Lateral no Cabo',
    category: 'shoulders',
    muscleGroups: ['Deltoides Médio'],
    equipment: 'Cabo',
    instructions: 'Elevação lateral usando cabos.'
  },
  {
    id: 'elevacao-frontal',
    name: 'Elevação Frontal',
    category: 'shoulders',
    muscleGroups: ['Deltoides Anterior'],
    equipment: 'Halteres',
    instructions: 'Eleve os braços à frente até a altura dos ombros.'
  },
  {
    id: 'elevacao-frontal-cabo',
    name: 'Elevação Frontal no Cabo',
    category: 'shoulders',
    muscleGroups: ['Deltoides Anterior'],
    equipment: 'Cabo',
    instructions: 'Elevação frontal usando cabo.'
  },
  {
    id: 'elevacao-frontal-barra',
    name: 'Elevação Frontal com Barra',
    category: 'shoulders',
    muscleGroups: ['Deltoides Anterior'],
    equipment: 'Barra',
    instructions: 'Elevação frontal com barra.'
  },
  {
    id: 'crucifixo-inverso',
    name: 'Crucifixo Inverso',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Halteres',
    instructions: 'Incline o tronco, abra os braços lateralmente.'
  },
  {
    id: 'crucifixo-inverso-cabo',
    name: 'Crucifixo Inverso no Cabo',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Cabo',
    instructions: 'Crucifixo inverso usando cabos.'
  },
  {
    id: 'voador-inverso',
    name: 'Voador Inverso',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Máquina',
    instructions: 'Crucifixo inverso na máquina voador.'
  },
  {
    id: 'remada-alta',
    name: 'Remada Alta',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Trapézio'],
    equipment: 'Barra',
    instructions: 'Puxe a barra até a altura do peito.'
  },
  {
    id: 'remada-alta-cabo',
    name: 'Remada Alta no Cabo',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Trapézio'],
    equipment: 'Cabo',
    instructions: 'Remada alta usando cabo.'
  },
  {
    id: 'desenvolvimento-maquina',
    name: 'Desenvolvimento na Máquina',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Máquina',
    instructions: 'Desenvolvimento executado na máquina.'
  },
  {
    id: 'elevacao-y',
    name: 'Elevação Y',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Trapézio'],
    equipment: 'Halteres',
    instructions: 'Elevação em Y com halteres.'
  },
  {
    id: 'elevacao-w',
    name: 'Elevação W',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior', 'Trapézio'],
    equipment: 'Halteres',
    instructions: 'Elevação em W com halteres.'
  },
  {
    id: 'passe-passaro',
    name: 'Passe de Pássaro',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Halteres',
    instructions: 'Movimento simulando voo de pássaro.'
  },
  {
    id: 'land-mine-press-ombro',
    name: 'Land Mine Press para Ombro',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Core'],
    equipment: 'Barra',
    instructions: 'Pressão com barra ancorada focando ombros.'
  },
  {
    id: 'pike-push-up',
    name: 'Pike Push Up',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão em posição de pike.'
  },
  {
    id: 'handstand-push-up',
    name: 'Handstand Push Up',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão em parada de mão.'
  },
  {
    id: 'elevacao-lateral-curvado',
    name: 'Elevação Lateral Curvado',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Halteres',
    instructions: 'Elevação lateral inclinado para frente.'
  },
  {
    id: 'elevacao-lateral-unilateral',
    name: 'Elevação Lateral Unilateral',
    category: 'shoulders',
    muscleGroups: ['Deltoides Médio'],
    equipment: 'Cabo',
    instructions: 'Elevação lateral de um braço por vez.'
  },
  {
    id: 'press-cuban',
    name: 'Press Cubano',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Manguito Rotador'],
    equipment: 'Halteres',
    instructions: 'Movimento combinado de rotação e elevação.'
  },
  {
    id: 'clean-and-press',
    name: 'Clean and Press',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Corpo Todo'],
    equipment: 'Barra',
    instructions: 'Movimento olímpico combinado.'
  },
  {
    id: 'push-press',
    name: 'Push Press',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Pernas'],
    equipment: 'Barra',
    instructions: 'Desenvolvimento com ajuda das pernas.'
  },
  {
    id: 'thruster',
    name: 'Thruster',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Pernas', 'Core'],
    equipment: 'Barra',
    instructions: 'Agachamento seguido de desenvolvimento.'
  },
  {
    id: 'wall-ball',
    name: 'Wall Ball',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Pernas', 'Core'],
    equipment: 'Medicine Ball',
    instructions: 'Arremesso de medicine ball na parede.'
  },
  {
    id: 'plate-raise',
    name: 'Plate Raise',
    category: 'shoulders',
    muscleGroups: ['Deltoides Anterior'],
    equipment: 'Anilhas',
    instructions: 'Elevação frontal com anilha.'
  },
  {
    id: 'behind-neck-press',
    name: 'Behind Neck Press',
    category: 'shoulders',
    muscleGroups: ['Deltoides', 'Tríceps'],
    equipment: 'Barra',
    instructions: 'Desenvolvimento por trás do pescoço.'
  },
  {
    id: 'bradford-press',
    name: 'Bradford Press',
    category: 'shoulders',
    muscleGroups: ['Deltoides'],
    equipment: 'Barra',
    instructions: 'Movimento alternado frente e trás.'
  },
  {
    id: 'bus-driver',
    name: 'Bus Driver',
    category: 'shoulders',
    muscleGroups: ['Deltoides'],
    equipment: 'Anilhas',
    instructions: 'Rotação de anilha como volante.'
  },
  {
    id: 'reverse-fly-inclinado',
    name: 'Reverse Fly Inclinado',
    category: 'shoulders',
    muscleGroups: ['Deltoides Posterior'],
    equipment: 'Halteres',
    instructions: 'Crucifixo inverso em banco inclinado.'
  },
  {
    id: 'scott-press',
    name: 'Scott Press',
    category: 'shoulders',
    muscleGroups: ['Deltoides'],
    equipment: 'Halteres',
    instructions: 'Desenvolvimento com rotação externa.'
  },
  {
    id: 'lateral-raise-21s',
    name: 'Lateral Raise 21s',
    category: 'shoulders',
    muscleGroups: ['Deltoides Médio'],
    equipment: 'Halteres',
    instructions: 'Elevação lateral em três amplitudes.'
  },
  
  // BRAÇOS - BÍCEPS (20 exercícios)
  {
    id: 'rosca-direta-barra',
    name: 'Rosca Direta com Barra',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra',
    instructions: 'Flexione os cotovelos, mantenha os cotovelos fixos.'
  },
  {
    id: 'rosca-direta-barra-w',
    name: 'Rosca Direta com Barra W',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra W',
    instructions: 'Rosca com barra W para maior conforto nos punhos.'
  },
  {
    id: 'rosca-alternada',
    name: 'Rosca Alternada',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Alterne os braços na execução da rosca.'
  },
  {
    id: 'rosca-simultanea',
    name: 'Rosca Simultânea',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Execute a rosca com ambos os braços ao mesmo tempo.'
  },
  {
    id: 'rosca-martelo',
    name: 'Rosca Martelo',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Braquial'],
    equipment: 'Halteres',
    instructions: 'Pegada neutra, trabalha o braquial.'
  },
  {
    id: 'rosca-concentrada',
    name: 'Rosca Concentrada',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Rosca sentado com cotovelo apoiado na coxa.'
  },
  {
    id: 'rosca-scott-barra',
    name: 'Rosca Scott com Barra',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra',
    instructions: 'Rosca no banco Scott com barra.'
  },
  {
    id: 'rosca-scott-halteres',
    name: 'Rosca Scott com Halteres',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Rosca no banco Scott com halteres.'
  },
  {
    id: 'rosca-scott-unilateral',
    name: 'Rosca Scott Unilateral',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Rosca Scott com um braço por vez.'
  },
  {
    id: 'rosca-cabo',
    name: 'Rosca no Cabo',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Cabo',
    instructions: 'Rosca usando cabo com barra reta.'
  },
  {
    id: 'rosca-cabo-martelo',
    name: 'Rosca Martelo no Cabo',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Braquial'],
    equipment: 'Cabo',
    instructions: 'Rosca martelo usando cabo.'
  },
  {
    id: 'rosca-21',
    name: 'Rosca 21',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra',
    instructions: '7 reps metade inferior + 7 superior + 7 completas.'
  },
  {
    id: 'rosca-spider',
    name: 'Rosca Spider',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra',
    instructions: 'Rosca na parte inclinada do banco Scott.'
  },
  {
    id: 'rosca-inversa',
    name: 'Rosca Inversa',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Antebraços'],
    equipment: 'Barra',
    instructions: 'Rosca com pegada pronada.'
  },
  {
    id: 'rosca-dragao',
    name: 'Rosca Dragão',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Barra',
    instructions: 'Rosca puxando a barra ao longo do corpo.'
  },
  {
    id: 'chin-ups-biceps',
    name: 'Chin Ups para Bíceps',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Latíssimo'],
    equipment: 'Barra Fixa',
    instructions: 'Barra fixa supinada focando nos bíceps.'
  },
  {
    id: 'rosca-inclinada',
    name: 'Rosca Inclinada',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Halteres',
    instructions: 'Rosca em banco inclinado 45°.'
  },
  {
    id: 'rosca-zottman',
    name: 'Rosca Zottman',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Antebraços'],
    equipment: 'Halteres',
    instructions: 'Sobe supinado, desce pronado.'
  },
  {
    id: 'hammer-cross-body',
    name: 'Hammer Cross Body',
    category: 'arms',
    muscleGroups: ['Bíceps', 'Braquial'],
    equipment: 'Halteres',
    instructions: 'Rosca martelo cruzando o corpo.'
  },
  {
    id: 'rosca-maquina',
    name: 'Rosca na Máquina',
    category: 'arms',
    muscleGroups: ['Bíceps'],
    equipment: 'Máquina',
    instructions: 'Rosca executada na máquina.'
  },
  
  // BRAÇOS - TRÍCEPS (20 exercícios)
  {
    id: 'triceps-pulley',
    name: 'Tríceps Pulley',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Cabo',
    instructions: 'Empurre o cabo para baixo, cotovelos fixos.'
  },
  {
    id: 'triceps-pulley-corda',
    name: 'Tríceps Pulley com Corda',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Cabo',
    instructions: 'Tríceps pulley usando corda.'
  },
  {
    id: 'triceps-testa',
    name: 'Tríceps Testa',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Barra',
    instructions: 'Deite e flexione apenas os cotovelos.'
  },
  {
    id: 'triceps-testa-halteres',
    name: 'Tríceps Testa com Halteres',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Halteres',
    instructions: 'Tríceps testa usando halteres.'
  },
  {
    id: 'triceps-frances',
    name: 'Tríceps Francês',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Halteres',
    instructions: 'Sentado, halter atrás da cabeça.'
  },
  {
    id: 'mergulho-paralelas',
    name: 'Mergulho nas Paralelas',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Paralelas',
    instructions: 'Desça controladamente, empurre para cima.'
  },
  {
    id: 'mergulho-banco',
    name: 'Mergulho no Banco',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Banco',
    instructions: 'Mergulho apoiando as mãos no banco.'
  },
  {
    id: 'supino-pegada-fechada',
    name: 'Supino Pegada Fechada',
    category: 'arms',
    muscleGroups: ['Tríceps', 'Peitoral'],
    equipment: 'Barra',
    instructions: 'Pegada mais fechada, enfatiza os tríceps.'
  },
  {
    id: 'triceps-coice',
    name: 'Tríceps Coice',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Halteres',
    instructions: 'Inclinado, estenda o braço para trás.'
  },
  {
    id: 'triceps-banco',
    name: 'Tríceps no Banco',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Halteres',
    instructions: 'Deitado no banco, halter acima da cabeça.'
  },
  {
    id: 'diamond-push-up',
    name: 'Flexão Diamante',
    category: 'arms',
    muscleGroups: ['Tríceps', 'Peitoral'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão com mãos formando diamante.'
  },
  {
    id: 'triceps-overhead',
    name: 'Tríceps Overhead',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Cabo',
    instructions: 'Extensão de tríceps acima da cabeça.'
  },
  {
    id: 'jm-press',
    name: 'JM Press',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Barra',
    instructions: 'Híbrido entre supino fechado e tríceps testa.'
  },
  {
    id: 'california-press',
    name: 'California Press',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Barra',
    instructions: 'Movimento diagonal para o peito.'
  },
  {
    id: 'triceps-maquina',
    name: 'Tríceps na Máquina',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Máquina',
    instructions: 'Extensão de tríceps na máquina.'
  },
  {
    id: 'triceps-unilateral',
    name: 'Tríceps Unilateral',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Cabo',
    instructions: 'Tríceps pulley com um braço.'
  },
  {
    id: 'triceps-supinado',
    name: 'Tríceps Supinado',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Cabo',
    instructions: 'Tríceps pulley com pegada supinada.'
  },
  {
    id: 'close-grip-push-up',
    name: 'Flexão Pegada Fechada',
    category: 'arms',
    muscleGroups: ['Tríceps', 'Peitoral'],
    equipment: 'Peso Corporal',
    instructions: 'Flexão com mãos próximas.'
  },
  {
    id: 'overhead-extension',
    name: 'Extensão Overhead',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Halteres',
    instructions: 'Extensão de tríceps em pé, halter acima.'
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    category: 'arms',
    muscleGroups: ['Tríceps'],
    equipment: 'Barra',
    instructions: 'Mesmo que tríceps testa, nome americano.'
  },
  
  // PERNAS E GLÚTEOS (40+ exercícios)
  {
    id: 'agachamento-livre',
    name: 'Agachamento Livre',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos', 'Posteriores'],
    equipment: 'Barra',
    instructions: 'Desça até os joelhos formarem 90°, empurre com os calcanhares.'
  },
  {
    id: 'agachamento-frontal',
    name: 'Agachamento Frontal',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Core'],
    equipment: 'Barra',
    instructions: 'Barra na frente, enfatiza mais os quadríceps.'
  },
  {
    id: 'agachamento-sumo',
    name: 'Agachamento Sumo',
    category: 'legs',
    muscleGroups: ['Glúteos', 'Adutores', 'Quadríceps'],
    equipment: 'Barra',
    instructions: 'Pés afastados, pontas voltadas para fora.'
  },
  {
    id: 'agachamento-bulgaro',
    name: 'Agachamento Búlgaro',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Um pé elevado atrás, agache com a perna da frente.'
  },
  {
    id: 'agachamento-hack',
    name: 'Agachamento Hack',
    category: 'legs',
    muscleGroups: ['Quadríceps'],
    equipment: 'Máquina',
    instructions: 'Agachamento na máquina hack squat.'
  },
  {
    id: 'leg-press-45',
    name: 'Leg Press 45°',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Máquina',
    instructions: 'Empurre a plataforma com os pés.'
  },
  {
    id: 'leg-press-horizontal',
    name: 'Leg Press Horizontal',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Máquina',
    instructions: 'Leg press na posição horizontal.'
  },
  {
    id: 'afundo-caminhando',
    name: 'Afundo Caminhando',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Alterne as pernas caminhando para frente.'
  },
  {
    id: 'afundo-reverso',
    name: 'Afundo Reverso',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Passo para trás, joelho quase toca o chão.'
  },
  {
    id: 'afundo-lateral',
    name: 'Afundo Lateral',
    category: 'legs',
    muscleGroups: ['Glúteos', 'Adutores', 'Quadríceps'],
    equipment: 'Halteres',
    instructions: 'Passo lateral, agache de um lado.'
  },
  {
    id: 'passada',
    name: 'Passada',
    category: 'legs',
    muscleGroups: ['Glúteos', 'Posteriores'],
    equipment: 'Halteres',
    instructions: 'Passo longo para frente, enfatiza glúteos.'
  },
  {
    id: 'cadeira-extensora',
    name: 'Cadeira Extensora',
    category: 'legs',
    muscleGroups: ['Quadríceps'],
    equipment: 'Máquina',
    instructions: 'Estenda os joelhos contra a resistência.'
  },
  {
    id: 'mesa-flexora',
    name: 'Mesa Flexora',
    category: 'legs',
    muscleGroups: ['Posteriores de Coxa'],
    equipment: 'Máquina',
    instructions: 'Flexione os joelhos contra a resistência.'
  },
  {
    id: 'flexora-em-pe',
    name: 'Flexora em Pé',
    category: 'legs',
    muscleGroups: ['Posteriores de Coxa'],
    equipment: 'Máquina',
    instructions: 'Flexora executada em pé.'
  },
  {
    id: 'stiff',
    name: 'Stiff',
    category: 'legs',
    muscleGroups: ['Posteriores de Coxa', 'Glúteos'],
    equipment: 'Barra',
    instructions: 'Pernas esticadas, flexione o quadril.'
  },
  {
    id: 'terra-romeno',
    name: 'Terra Romeno',
    category: 'legs',
    muscleGroups: ['Posteriores de Coxa', 'Glúteos'],
    equipment: 'Barra',
    instructions: 'Joelhos levemente flexionados, quadril para trás.'
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    category: 'legs',
    muscleGroups: ['Glúteos'],
    equipment: 'Barra',
    instructions: 'Costas no banco, empurre o quadril para cima.'
  },
  {
    id: 'elevacao-quadril',
    name: 'Elevação de Quadril',
    category: 'legs',
    muscleGroups: ['Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Deitado, eleve o quadril contraindo glúteos.'
  },
  {
    id: 'agachamento-wall-sit',
    name: 'Wall Sit',
    category: 'legs',
    muscleGroups: ['Quadríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Encostado na parede, mantenha posição de agachamento.'
  },
  {
    id: 'agachamento-pistol',
    name: 'Agachamento Pistol',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Agachamento com uma perna só.'
  },
  {
    id: 'passada-elevada',
    name: 'Passada Elevada',
    category: 'legs',
    muscleGroups: ['Glúteos', 'Quadríceps'],
    equipment: 'Halteres',
    instructions: 'Subida no banco com passada.'
  },
  {
    id: 'subida-banco',
    name: 'Subida no Banco',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Suba no banco alternando as pernas.'
  },
  {
    id: 'panturrilha-em-pe',
    name: 'Panturrilha em Pé',
    category: 'legs',
    muscleGroups: ['Panturrilhas'],
    equipment: 'Halteres',
    instructions: 'Eleve-se na ponta dos pés.'
  },
  {
    id: 'panturrilha-sentada',
    name: 'Panturrilha Sentada',
    category: 'legs',
    muscleGroups: ['Panturrilhas'],
    equipment: 'Máquina',
    instructions: 'Panturrilha executada sentado.'
  },
  {
    id: 'panturrilha-leg-press',
    name: 'Panturrilha no Leg Press',
    category: 'legs',
    muscleGroups: ['Panturrilhas'],
    equipment: 'Máquina',
    instructions: 'Use apenas a ponta dos pés no leg press.'
  },
  {
    id: 'adutora',
    name: 'Adutora',
    category: 'legs',
    muscleGroups: ['Adutores'],
    equipment: 'Máquina',
    instructions: 'Aproxime as pernas contra resistência.'
  },
  {
    id: 'abdutora',
    name: 'Abdutora',
    category: 'legs',
    muscleGroups: ['Abdutores', 'Glúteo Médio'],
    equipment: 'Máquina',
    instructions: 'Afaste as pernas contra resistência.'
  },
  {
    id: 'agachamento-cossaco',
    name: 'Agachamento Cossaco',
    category: 'legs',
    muscleGroups: ['Adutores', 'Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Agachamento lateral alternando lados.'
  },
  {
    id: 'squat-jump',
    name: 'Squat Jump',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Agachamento explosivo com salto.'
  },
  {
    id: 'lunge-jump',
    name: 'Lunge Jump',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Afundo com salto alternando pernas.'
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Agachamento segurando halter no peito.'
  },
  {
    id: 'single-leg-deadlift',
    name: 'Stiff Unilateral',
    category: 'legs',
    muscleGroups: ['Posteriores', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Stiff com uma perna só.'
  },
  {
    id: 'curtsy-lunge',
    name: 'Curtsy Lunge',
    category: 'legs',
    muscleGroups: ['Glúteos', 'Quadríceps'],
    equipment: 'Halteres',
    instructions: 'Afundo cruzando a perna por trás.'
  },
  {
    id: 'glute-bridge',
    name: 'Ponte para Glúteos',
    category: 'legs',
    muscleGroups: ['Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Deitado, eleve o quadril contraindo glúteos.'
  },
  {
    id: 'calf-raise-unilateral',
    name: 'Panturrilha Unilateral',
    category: 'legs',
    muscleGroups: ['Panturrilhas'],
    equipment: 'Halteres',
    instructions: 'Panturrilha com uma perna por vez.'
  },
  {
    id: 'reverse-lunge-knee-up',
    name: 'Afundo Reverso com Joelho',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Peso Corporal',
    instructions: 'Afundo reverso elevando joelho ao voltar.'
  },
  {
    id: 'sissy-squat',
    name: 'Sissy Squat',
    category: 'legs',
    muscleGroups: ['Quadríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Agachamento inclinando para trás.'
  },
  {
    id: 'jefferson-squat',
    name: 'Jefferson Squat',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Barra',
    instructions: 'Agachamento com barra entre as pernas.'
  },
  {
    id: 'box-squat',
    name: 'Box Squat',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Barra',
    instructions: 'Agachamento sentando em caixa.'
  },
  {
    id: 'good-morning-pernas',
    name: 'Good Morning',
    category: 'legs',
    muscleGroups: ['Posteriores', 'Glúteos'],
    equipment: 'Barra',
    instructions: 'Flexão de quadril com barra nas costas.'
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    category: 'legs',
    muscleGroups: ['Quadríceps', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Afundo caminhando continuamente.'
  },
  {
    id: 'lateral-lunge',
    name: 'Lateral Lunge',
    category: 'legs',
    muscleGroups: ['Adutores', 'Glúteos'],
    equipment: 'Halteres',
    instructions: 'Afundo para o lado.'
  },
  
  // ABDÔMEN E CORE (26 exercícios)
  {
    id: 'abdominal-tradicional',
    name: 'Abdominal Tradicional',
    category: 'core',
    muscleGroups: ['Abdômen Superior'],
    equipment: 'Peso Corporal',
    instructions: 'Flexione o tronco, não puxe o pescoço.'
  },
  {
    id: 'abdominal-infra',
    name: 'Abdominal Infra',
    category: 'core',
    muscleGroups: ['Abdômen Inferior'],
    equipment: 'Peso Corporal',
    instructions: 'Eleve as pernas flexionando o quadril.'
  },
  {
    id: 'prancha',
    name: 'Prancha',
    category: 'core',
    muscleGroups: ['Core', 'Abdômen'],
    equipment: 'Peso Corporal',
    instructions: 'Mantenha o corpo alinhado, contraia o abdômen.'
  },
  {
    id: 'prancha-lateral',
    name: 'Prancha Lateral',
    category: 'core',
    muscleGroups: ['Oblíquos', 'Core'],
    equipment: 'Peso Corporal',
    instructions: 'Prancha de lado, corpo alinhado.'
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Climber',
    category: 'core',
    muscleGroups: ['Core', 'Cardio'],
    equipment: 'Peso Corporal',
    instructions: 'Alterne os joelhos rapidamente em direção ao peito.'
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'core',
    muscleGroups: ['Oblíquos'],
    equipment: 'Peso Corporal',
    instructions: 'Gire o tronco de um lado para o outro.'
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    category: 'core',
    muscleGroups: ['Abdômen', 'Oblíquos'],
    equipment: 'Peso Corporal',
    instructions: 'Cotovelo ao joelho oposto alternadamente.'
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'core',
    muscleGroups: ['Core', 'Estabilização'],
    equipment: 'Peso Corporal',
    instructions: 'Deitado, mova braço e perna opostos.'
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    category: 'core',
    muscleGroups: ['Core', 'Estabilização'],
    equipment: 'Peso Corporal',
    instructions: 'Quatro apoios, estenda braço e perna opostos.'
  },
  {
    id: 'elevacao-pernas-suspensa',
    name: 'Elevação de Pernas Suspensa',
    category: 'core',
    muscleGroups: ['Abdômen Inferior'],
    equipment: 'Barra Fixa',
    instructions: 'Suspenda-se na barra, eleve as pernas.'
  },
  {
    id: 'elevacao-joelhos-suspensa',
    name: 'Elevação de Joelhos Suspensa',
    category: 'core',
    muscleGroups: ['Abdômen Inferior'],
    equipment: 'Barra Fixa',
    instructions: 'Suspenda-se na barra, eleve os joelhos.'
  },
  {
    id: 'v-up',
    name: 'V-Up',
    category: 'core',
    muscleGroups: ['Abdômen'],
    equipment: 'Peso Corporal',
    instructions: 'Toque os pés com as mãos formando V.'
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    category: 'core',
    muscleGroups: ['Abdômen'],
    equipment: 'Peso Corporal',
    instructions: 'Mantenha posição de barquinho.'
  },
  {
    id: 'ab-wheel',
    name: 'Roda Abdominal',
    category: 'core',
    muscleGroups: ['Abdômen', 'Core'],
    equipment: 'Roda',
    instructions: 'Role a roda para frente e volte.'
  },
  {
    id: 'cable-crunch',
    name: 'Abdominal no Cabo',
    category: 'core',
    muscleGroups: ['Abdômen'],
    equipment: 'Cabo',
    instructions: 'Ajoelhado, puxe o cabo flexionando tronco.'
  },
  {
    id: 'wood-chop',
    name: 'Wood Chop',
    category: 'core',
    muscleGroups: ['Oblíquos', 'Core'],
    equipment: 'Cabo',
    instructions: 'Movimento diagonal como cortar lenha.'
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    category: 'core',
    muscleGroups: ['Core', 'Estabilização'],
    equipment: 'Cabo',
    instructions: 'Resista à rotação estendendo braços.'
  },
  {
    id: 'leg-raise-banco',
    name: 'Elevação de Pernas no Banco',
    category: 'core',
    muscleGroups: ['Abdômen Inferior'],
    equipment: 'Banco',
    instructions: 'Deitado no banco, eleve as pernas.'
  },
  {
    id: 'decline-sit-up',
    name: 'Abdominal Declinado',
    category: 'core',
    muscleGroups: ['Abdômen'],
    equipment: 'Banco',
    instructions: 'Abdominal em banco declinado.'
  },
  {
    id: 'sit-up-medicine-ball',
    name: 'Sit Up com Medicine Ball',
    category: 'core',
    muscleGroups: ['Abdômen'],
    equipment: 'Medicine Ball',
    instructions: 'Abdominal segurando medicine ball.'
  },
  {
    id: 'plank-up-down',
    name: 'Plank Up Down',
    category: 'core',
    muscleGroups: ['Core', 'Tríceps'],
    equipment: 'Peso Corporal',
    instructions: 'Alterne entre prancha e prancha nos antebraços.'
  },
  {
    id: 'spiderman-plank',
    name: 'Spiderman Plank',
    category: 'core',
    muscleGroups: ['Core', 'Oblíquos'],
    equipment: 'Peso Corporal',
    instructions: 'Prancha levando joelho ao cotovelo.'
  },
  {
    id: 'bear-crawl',
    name: 'Bear Crawl',
    category: 'core',
    muscleGroups: ['Core', 'Corpo Todo'],
    equipment: 'Peso Corporal',
    instructions: 'Caminhe em quatro apoios sem tocar joelhos.'
  },
  {
    id: 'turkish-get-up',
    name: 'Turkish Get Up',
    category: 'core',
    muscleGroups: ['Core', 'Corpo Todo'],
    equipment: 'Kettlebell',
    instructions: 'Movimento complexo de deitar para em pé.'
  },
  {
    id: 'windshield-wiper',
    name: 'Windshield Wiper',
    category: 'core',
    muscleGroups: ['Oblíquos'],
    equipment: 'Peso Corporal',
    instructions: 'Pernas para cima, mova lateralmente.'
  },
  {
    id: 'dragon-flag',
    name: 'Dragon Flag',
    category: 'core',
    muscleGroups: ['Abdômen', 'Core'],
    equipment: 'Banco',
    instructions: 'Corpo reto suspenso pelos ombros.'
  },
  
  // EXERCÍCIOS FUNCIONAIS (10 exercícios)
  {
    id: 'burpee',
    name: 'Burpee',
    category: 'cardio',
    muscleGroups: ['Corpo Todo'],
    equipment: 'Peso Corporal',
    instructions: 'Agachamento, prancha, flexão, salto.'
  },
  {
    id: 'thruster-funcional',
    name: 'Thruster',
    category: 'cardio',
    muscleGroups: ['Corpo Todo'],
    equipment: 'Halteres',
    instructions: 'Agachamento seguido de desenvolvimento.'
  },
  {
    id: 'man-maker',
    name: 'Man Maker',
    category: 'cardio',
    muscleGroups: ['Corpo Todo'],
    equipment: 'Halteres',
    instructions: 'Burpee com remada e desenvolvimento.'
  },
  {
    id: 'devils-press',
    name: "Devil's Press",
    category: 'cardio',
    muscleGroups: ['Corpo Todo'],
    equipment: 'Halteres',
    instructions: 'Burpee com halteres e desenvolvimento.'
  },
  {
    id: 'farmers-walk',
    name: "Farmer's Walk",
    category: 'cardio',
    muscleGroups: ['Core', 'Antebraços'],
    equipment: 'Halteres',
    instructions: 'Caminhe carregando peso nas mãos.'
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    category: 'cardio',
    muscleGroups: ['Corpo Todo'],
    equipment: 'Cordas',
    instructions: 'Movimente cordas pesadas alternadamente.'
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    category: 'cardio',
    muscleGroups: ['Glúteos', 'Core'],
    equipment: 'Kettlebell',
    instructions: 'Balanço com kettlebell usando quadril.'
  },
  {
    id: 'box-jump',
    name: 'Box Jump',
    category: 'cardio',
    muscleGroups: ['Pernas', 'Potencia'],
    equipment: 'Caixa',
    instructions: 'Salto explosivo sobre a caixa.'
  },
  {
    id: 'medicine-ball-slam',
    name: 'Medicine Ball Slam',
    category: 'cardio',
    muscleGroups: ['Core', 'Corpo Todo'],
    equipment: 'Medicine Ball',
    instructions: 'Arremesse a bola no chão com força.'
  },
  {
    id: 'sled-push',
    name: 'Sled Push',
    category: 'cardio',
    muscleGroups: ['Pernas', 'Core'],
    equipment: 'Sled',
    instructions: 'Empurre o trenó com peso.'
  }
];

// Helper functions
export const getExercisesByCategory = (category: Exercise['category']): Exercise[] => {
  return DEFAULT_EXERCISES.filter(exercise => exercise.category === category);
};

export const getExerciseById = (id: string): Exercise | undefined => {
  return DEFAULT_EXERCISES.find(exercise => exercise.id === id);
};

export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_EXERCISES.filter(exercise => 
    exercise.name.toLowerCase().includes(lowerQuery) ||
    exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(lowerQuery))
  );
};

export const EXERCISE_CATEGORIES = [
  { id: 'chest', name: 'Peito', icon: 'fitness' },
  { id: 'back', name: 'Costas', icon: 'body' },
  { id: 'shoulders', name: 'Ombros', icon: 'body' },
  { id: 'arms', name: 'Braços', icon: 'barbell' },
  { id: 'legs', name: 'Pernas', icon: 'walk' },
  { id: 'core', name: 'Abdômen/Core', icon: 'fitness' },
  { id: 'cardio', name: 'Funcionais', icon: 'flash' }
] as const;