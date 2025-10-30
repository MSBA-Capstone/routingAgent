// frontend/src/guidedFlow.js
// Definitions and helpers for the multi-step guided question experience.

export const GUIDED_FLOW = [
	{
		id: 'from',
		prompt: 'Where is the starting location for your route?',
		storageKey: 'from',
		mode: 'collect',
		acknowledgement: `Got it! Starting point noted.`,
	},
	{
		id: 'to',
		prompt: 'Where is the destination location for your route?',
		storageKey: 'to',
		mode: 'collect',
		acknowledgement: `Got it! Destination noted.`,
	},
	{
		id: 'duration',
		prompt: 'What is the duration of your trip in days?',
		storageKey: 'duration',
		mode: 'collect',
		acknowledgement: 'Understood! Duration recorded.',
	},
	{
		id: 'drivingHoursPerDay',
		prompt: 'How many hours do you plan to drive each day?',
		repeatPrompt: 'Let\'s try that again. Could you share any extra notes or context?',
		storageKey: 'drivingHoursPerDay',
		mode: 'api',
		endpoint: '/init',
		payloadKey: 'query',
		acknowledgement: 'Great, let me think on that for a moment...',
		repeatIndex: 0,  // Go back to the first question if this fails
		buildPayload: ({ answers, currentAnswer, history }) => {
			const from = answers.from || 'unknown';
			const to = answers.to || 'unknown';
			const duration = answers.duration || 'unknown';
			const drivingHoursPerDay = currentAnswer || 'unknown';

			const query = [
				`I am planning a road trip from ${from} to ${to}.`,
                `The trip will last ${duration} days,`,
                `and I plan to drive about ${drivingHoursPerDay} hours each day.`,
                'Please provide any additional notes or context that would help in planning this route.',
			].join('\n');

			return {
				query,
				history,
				questionId: 'notes',
				answers,
			};
		},
		parseResponse: (data) => ({
			answer: data.answer || data.message || 'No answer returned.',
			continueFlow: data.continue !== false,
		}),
	},
    {
        id: 'routePreference',
        prompt: "Are you in a hurry to reach your destination?",
        storageKey: 'routePreference',
        mode: "api",
        endpoint: "/utility_itinerary",
        payloadKey: "query",
        acknowledgement: "Thanks for the info! Let me process that...",
        options: ['Yes', 'No'],
        buildPayload: ({ answers, currentAnswer, history }) => {
            const from = answers.from || 'unknown';
            const to = answers.to || 'unknown';
            const duration = answers.duration || 'unknown';
            const drivingHoursPerDay = answers.drivingHoursPerDay || 'unknown';
            const routePreference = currentAnswer || 'unknown';
            const query = [
                `I am planning a road trip from ${from} to ${to}.`,
                `The trip will last ${duration} days after ${duration} days I must arrive at ${to},`,
                `and I plan to drive about ${drivingHoursPerDay} hours each day.`,
                `Regarding hurry: ${routePreference}.`,
            ].join('\n');

            return {
                query,
                history,
                questionId: 'notes',
                answers,
            };
        },
        parseResponse: (data) => ({
            answer: data.answer || data.message || 'No answer returned.',
            continueFlow: data.continue !== false,
        }),
    },
];

export const GUIDED_FLOW_COMPLETE_MESSAGE =
	'Thanks - that completes the guided questions.';
