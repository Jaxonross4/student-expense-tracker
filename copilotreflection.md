GitHub Copilot Reflection
How I Used GitHub Copilot

I used GitHub Copilot to help generate the new ChartScreen for my project and speed up repetitive coding tasks. Copilot assisted me with creating the structure of the chart component, writing the SQL query for grouping expenses by category, setting up navigation, and generating chart configuration options. Some prompts I used included:

“Generate a ChartScreen component that displays a bar chart in React Native.”

“Write a SQL query to group expenses by category.”

“Create navigation code for switching between two screens.”

“Add chart configuration for a bar chart.”

Copilot provided helpful suggestions quickly and allowed me to focus more on integrating everything into my existing app.

A Suggestion I Changed or Rejected

One Copilot suggestion I rejected was the use of hard-coded chart data, such as:

data={{
  labels: ['Food', 'Bills', 'Gas'],
  datasets: [{ data: [100, 80, 45] }]
}}


I could not use this because the assignment requires the chart to be connected to real application data, not static placeholder values. Instead, I replaced this with a SQL query that pulls totals directly from my database:

SELECT category, SUM(amount) AS total
FROM expenses
GROUP BY category;


This ensures that the chart updates automatically when new expenses are added.

A Copilot Suggestion I Accepted

I accepted Copilot’s suggestion for the chartConfig object inside the BarChart component. Copilot generated color functions, gradients, and layout options that were compatible with react-native-chart-kit. This saved time because manually configuring chart appearance is repetitive and easy to make mistakes with.

How Copilot Saved Me Time

Copilot saved me time by generating reusable code structures, SQL queries, navigation boilerplate, and chart configuration settings. It reduced trial-and-error and allowed me to focus on connecting the chart to actual expense data and making sure the analytics screen worked correctly. Using Copilot made the overall development process faster and more efficient.