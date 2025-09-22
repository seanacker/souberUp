export const setUsageGoalMutation = (usageGoal: string) => `
    mutation SetUsageGoal {
        setUsageGoal(usageGoal: ${usageGoal}) {
            success
        }
    }
`;