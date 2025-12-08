import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useSQLiteContext } from 'expo-sqlite';

export default function ChartScreen() {
  const db = useSQLiteContext();
  const [categoryData, setCategoryData] = useState([]);

  const loadCategoryTotals = async () => {
    const rows = await db.getAllAsync(
      `SELECT category, SUM(amount) AS total
       FROM expenses
       GROUP BY category`
    );
    setCategoryData(rows);
  };

  useEffect(() => {
    loadCategoryTotals();
  }, []);

  const labels = categoryData.map(item => item.category);
  const totals = categoryData.map(item => item.total);

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 20 }}>
        Spending by Category
      </Text>

      {totals.length > 0 ? (
        <BarChart
          data={{
            labels: labels,
            datasets: [{ data: totals }],
          }}
          width={Dimensions.get('window').width - 32}
          height={300}
          fromZero
          showValuesOnTopOfBars
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: () => '#000',
            style: { borderRadius: 12 },
          }}
          style={{ borderRadius: 12 }}
        />
      ) : (
        <Text>No expense data available for chart.</Text>
      )}
    </ScrollView>
  );
}

