import { useState, useEffect, useRef } from 'react';
import { GUIDED_FLOW } from '../guidedFlow';

export function useGuidedFlow(authenticated, setMessages) {
  const [guidedMode, setGuidedMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState({});
  const guidedAnswersRef = useRef(guidedAnswers);

  useEffect(() => {
    guidedAnswersRef.current = guidedAnswers;
  }, [guidedAnswers]);

  useEffect(() => {
    if (!authenticated) return;

    const firstQuestion = GUIDED_FLOW[0];
    const initialMessages = [
      { id: 'welcome', role: 'assistant', text: 'Hi! I am your Road Trip assistant. I will guide you through a few questions.' },
    ];

    if (firstQuestion) {
      initialMessages.push({ id: `g-${firstQuestion.id}-0`, role: 'assistant', text: firstQuestion.prompt });
      setGuidedMode(true);
      setCurrentQuestionIndex(0);
    } else {
      setGuidedMode(false);
      setCurrentQuestionIndex(0);
    }

    guidedAnswersRef.current = {};
    setGuidedAnswers({});
    setMessages(initialMessages);
  }, [authenticated, setMessages]);

  const finishFlow = () => {
    setGuidedMode(false);
    setCurrentQuestionIndex(GUIDED_FLOW.length);
    setMessages(prev => {
      const alreadyComplete = prev.some(m => m.meta === 'guided-complete');
      if (alreadyComplete) {
        return prev;
      }
      return [...prev];
    });
  };

  const promptQuestion = (index, options = {}) => {
    const question = GUIDED_FLOW[index];
    if (!question) {
      finishFlow();
      return;
    }

    const { repeat = false } = options;
    const text = repeat && question.repeatPrompt ? question.repeatPrompt : question.prompt;

    setMessages(prev => [
      ...prev,
      {
        id: `g-${question.id}-${Date.now()}`,
        role: 'assistant',
        text,
      },
    ]);
    setGuidedMode(true);
    setCurrentQuestionIndex(index);
  };

  const storeGuidedAnswer = (key, value) => {
    if (!key) {
      return guidedAnswersRef.current;
    }
    const next = { ...guidedAnswersRef.current, [key]: value };
    guidedAnswersRef.current = next;
    setGuidedAnswers(next);
    return next;
  };

  return {
    guidedMode,
    currentQuestionIndex,
    guidedAnswers: guidedAnswersRef.current,
    finishFlow,
    promptQuestion,
    storeGuidedAnswer,
  };
}