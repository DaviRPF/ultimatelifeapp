import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../constants/theme';

export interface QuestionnaireResult {
  difficulty: number;
  importance: number;
  fear: number;
}

interface Props {
  onComplete: (result: QuestionnaireResult) => void;
  onCancel: () => void;
}

interface Question {
  id: number;
  category: 'difficulty' | 'importance' | 'fear';
  question: string;
  options: { text: string; points: number }[];
}

const questions: Question[] = [
  // Dificuldade (1-5)
  {
    id: 1,
    category: 'difficulty',
    question: 'Quão familiar você está com as etapas para concluir esta tarefa?',
    options: [
      { text: 'Sei exatamente o que fazer.', points: 1 },
      { text: 'Tenho uma ideia, mas preciso de alguns detalhes.', points: 2 },
      { text: 'Preciso pesquisar bastante sobre os passos.', points: 3 },
      { text: 'Não faço a menor ideia de como começar.', points: 4 },
    ]
  },
  {
    id: 2,
    category: 'difficulty',
    question: 'Qual o seu nível de habilidade atual para realizar esta tarefa?',
    options: [
      { text: 'Já domino a habilidade necessária.', points: 1 },
      { text: 'Tenho a habilidade, mas preciso de atenção e foco.', points: 2 },
      { text: 'É um desafio, mas consigo com esforço extra.', points: 3 },
      { text: 'Demanda uma habilidade nova ou que não tenho.', points: 4 },
    ]
  },
  {
    id: 3,
    category: 'difficulty',
    question: 'Em que medida a tarefa é fisicamente ou mentalmente cansativa para você?',
    options: [
      { text: 'É leve e relaxante.', points: 1 },
      { text: 'Cansativa, mas de forma moderada.', points: 2 },
      { text: 'Muito cansativa, pode me deixar exausto(a).', points: 3 },
      { text: 'Extremamente exaustiva, vai consumir toda a minha energia.', points: 4 },
    ]
  },
  {
    id: 4,
    category: 'difficulty',
    question: 'Com que frequência você adia essa tarefa por achá-la difícil?',
    options: [
      { text: 'Nunca adiei.', points: 1 },
      { text: 'Raramente.', points: 2 },
      { text: 'Às vezes.', points: 3 },
      { text: 'Constantemente.', points: 4 },
    ]
  },
  {
    id: 5,
    category: 'difficulty',
    question: 'Qual o nível de confiança que você tem em sua capacidade de evitar erros que a forçariam a recomeçar?',
    options: [
      { text: 'Tenho total confiança.', points: 1 },
      { text: 'Tenho confiança, mas sei que erros podem acontecer.', points: 2 },
      { text: 'Não me sinto muito confiante.', points: 3 },
      { text: 'Não tenho nenhuma confiança.', points: 4 },
    ]
  },
  // Importância (6-10)
  {
    id: 6,
    category: 'importance',
    question: 'Em que medida essa tarefa se alinha aos seus grandes objetivos de vida no momento?',
    options: [
      { text: 'Não tem nenhuma relação.', points: 1 },
      { text: 'É um pequeno passo na direção certa.', points: 2 },
      { text: 'Contribui significativamente para um dos meus objetivos.', points: 3 },
      { text: 'É uma tarefa crucial para um dos meus maiores objetivos.', points: 4 },
    ]
  },
  {
    id: 7,
    category: 'importance',
    question: 'Deixar essa tarefa por fazer causa estresse ou ansiedade para você?',
    options: [
      { text: 'Nem um pouco.', points: 1 },
      { text: 'Um pouco de ansiedade, mas é gerenciável.', points: 2 },
      { text: 'Sim, causa uma ansiedade considerável.', points: 3 },
      { text: 'Sim, me causa muito estresse e me sinto culpado(a) por não fazer.', points: 4 },
    ]
  },
  {
    id: 8,
    category: 'importance',
    question: 'A tarefa é uma parte vital de sua rotina diária ou semanal?',
    options: [
      { text: 'Não, é uma tarefa ocasional.', points: 1 },
      { text: 'Raramente, mas seria bom fazer com mais frequência.', points: 2 },
      { text: 'Sim, é uma tarefa regular, mas não essencial.', points: 3 },
      { text: 'Sim, é uma parte essencial e recorrente da minha rotina.', points: 4 },
    ]
  },
  {
    id: 9,
    category: 'importance',
    question: 'Qual o seu nível de motivação para começar e terminar esta tarefa?',
    options: [
      { text: 'Nenhum.', points: 1 },
      { text: 'Baixo.', points: 2 },
      { text: 'Moderado.', points: 3 },
      { text: 'Alto.', points: 4 },
    ]
  },
  {
    id: 10,
    category: 'importance',
    question: 'Você se sente comprometido(a) a completar a tarefa, mesmo diante de obstáculos?',
    options: [
      { text: 'Não. Eu desistiria facilmente se surgissem dificuldades.', points: 1 },
      { text: 'Baixo. Minha dedicação é frágil e posso desistir.', points: 2 },
      { text: 'Moderado. Estou comprometido(a), mas desafios podem me abalar.', points: 3 },
      { text: 'Alto. Estou totalmente comprometido(a) e vou persistir até o fim.', points: 4 },
    ]
  },
  // Medo (11-15)
  {
    id: 11,
    category: 'fear',
    question: 'Que sentimento você tem quando pensa em fazer essa tarefa?',
    options: [
      { text: 'Sentimento positivo ou neutro.', points: 1 },
      { text: 'Uma leve preocupação ou desinteresse.', points: 2 },
      { text: 'Aversão ou desconforto.', points: 3 },
      { text: 'Pavor ou uma forte sensação de dread.', points: 4 },
    ]
  },
  {
    id: 12,
    category: 'fear',
    question: 'Você se preocupa em ser julgado(a) ou em falhar enquanto faz esta tarefa?',
    options: [
      { text: 'Não.', points: 1 },
      { text: 'Um pouco, mas não me impede de fazer.', points: 2 },
      { text: 'Sim, me preocupo, e isso me deixa nervoso(a).', points: 3 },
      { text: 'Sim, e essa preocupação é paralisante.', points: 4 },
    ]
  },
  {
    id: 13,
    category: 'fear',
    question: 'A tarefa parece tão grande que você não sabe por onde começar?',
    options: [
      { text: 'De forma alguma, já sei como dividi-la.', points: 1 },
      { text: 'Um pouco, mas consigo descobrir o primeiro passo.', points: 2 },
      { text: 'Sim, a ideia de começar me sobrecarrega.', points: 3 },
      { text: 'Sim, me sinto totalmente paralisado(a) pela dimensão da tarefa.', points: 4 },
    ]
  },
  {
    id: 14,
    category: 'fear',
    question: 'Você se pega procrastinando nesta tarefa por medo ou aversão?',
    options: [
      { text: 'Não. Eu a faço prontamente.', points: 1 },
      { text: 'Raramente.', points: 2 },
      { text: 'Com frequência.', points: 3 },
      { text: 'Constantemente.', points: 4 },
    ]
  },
  {
    id: 15,
    category: 'fear',
    question: 'Qual a força da sua crença de que você não vai conseguir fazer esta tarefa?',
    options: [
      { text: 'Não, me sinto muito confiante.', points: 1 },
      { text: 'Um pouco, mas é uma dúvida que posso superar.', points: 2 },
      { text: 'Sim, me falta confiança e isso me deixa hesitante.', points: 3 },
      { text: 'Sim, tenho uma forte crença de que irei fracassar.', points: 4 },
    ]
  },
];

const TaskEvaluationQuestionnaire: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswer = (points: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: points };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Calculate results
      const result = calculateResults(newAnswers);
      onComplete(result);
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateResults = (allAnswers: { [key: number]: number }): QuestionnaireResult => {
    let difficultyTotal = 0;
    let importanceTotal = 0;
    let fearTotal = 0;

    questions.forEach(question => {
      const points = allAnswers[question.id] || 1;
      switch (question.category) {
        case 'difficulty':
          difficultyTotal += points;
          break;
        case 'importance':
          importanceTotal += points;
          break;
        case 'fear':
          fearTotal += points;
          break;
      }
    });

    // Convert to percentages (points range: 5-20, convert to 25-100%)
    const difficultyPercentage = Math.round((difficultyTotal / 20) * 100);
    const importancePercentage = Math.round((importanceTotal / 20) * 100);
    const fearPercentage = Math.round((fearTotal / 20) * 100);

    return {
      difficulty: Math.max(25, difficultyPercentage), // Minimum 25%
      importance: Math.max(25, importancePercentage),
      fear: Math.max(25, fearPercentage),
    };
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'difficulty':
        return { name: 'Dificuldade', color: Colors.difficulty, icon: 'barbell' as const };
      case 'importance':
        return { name: 'Importância', color: Colors.importance, icon: 'star' as const };
      case 'fear':
        return { name: 'Medo/Ansiedade', color: Colors.fear, icon: 'warning' as const };
      default:
        return { name: '', color: Colors.text, icon: 'help' as const };
    }
  };

  const categoryInfo = getCategoryInfo(currentQuestion.category);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Avaliação de Quest</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} de {totalQuestions}
        </Text>
      </View>

      {/* Category Badge */}
      <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
        <Ionicons name={categoryInfo.icon} size={20} color={categoryInfo.color} />
        <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
          {categoryInfo.name}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                answers[currentQuestion.id] === option.points && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswer(option.points)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion.id] === option.points && styles.optionTextSelected
                ]}>
                  {option.text}
                </Text>
                <Text style={[
                  styles.pointsText,
                  answers[currentQuestion.id] === option.points && styles.pointsTextSelected
                ]}>
                  {option.points} {option.points === 1 ? 'ponto' : 'pontos'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? Colors.textSecondary : Colors.text} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
            Anterior
          </Text>
        </TouchableOpacity>

        <Text style={styles.instructionText}>
          {isLastQuestion ? 'Responda para finalizar' : 'Responda para continuar'}
        </Text>

        <View style={styles.navButtonPlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginBottom: Spacing.lg,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    marginLeft: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  questionContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionText: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  optionContent: {
    gap: Spacing.sm,
  },
  optionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pointsTextSelected: {
    color: Colors.primary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  navButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  navButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  navButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  navButtonPlaceholder: {
    width: 80,
  },
  instructionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TaskEvaluationQuestionnaire;