// ExpenseScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

// Helper to get today's date as "YYYY-MM-DD"
function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

// Turn "YYYY-MM-DD" into a JS Date object
function parseDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// Check if a date string is in the current week (Sun–Sat)
function isThisWeek(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;

  const today = new Date();
  const day = today.getDay(); // 0–6
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return d >= start && d <= end;
}

// Check if a date string is in the current month
function isThisMonth(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = new Date();
  return (
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export default function ExpenseScreen() {
  const db = useSQLiteContext();

  // All expenses from the database
  const [expenses, setExpenses] = useState([]);

  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  // Filter: ALL, WEEK, MONTH
  const [filter, setFilter] = useState('ALL');

  // Editing state: null = adding, number = editing that id
  const [editingId, setEditingId] = useState(null);

  // Load expenses from DB
  const loadExpenses = async () => {
    const rows = await db.getAllAsync(
      'SELECT * FROM expenses ORDER BY id DESC;'
    );

    // Make sure every row has a date so filters and UI don't break
    const rowsWithDate = rows.map((row) => ({
      ...row,
      date: row.date || getTodayString(),
    }));

    setExpenses(rowsWithDate);
  };

  // Add a new expense
  const addExpense = async () => {
    const amountNumber = parseFloat(amount);

    if (isNaN(amountNumber) || amountNumber <= 0) {
      return; // invalid amount
    }

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();

    if (!trimmedCategory) {
      return; // category required
    }

    await db.runAsync(
      'INSERT INTO expenses (amount, category, note, date) VALUES (?, ?, ?, ?);',
      [amountNumber, trimmedCategory, trimmedNote || null, getTodayString()]
    );

    setAmount('');
    setCategory('');
    setNote('');

    loadExpenses();
  };

  // Update an existing expense
  const updateExpense = async () => {
    if (editingId === null) return;

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return;
    }

    const trimmedCategory = category.trim();
    const trimmedNote = note.trim();
    if (!trimmedCategory) {
      return;
    }

    // keep existing date if we can
    const existing = expenses.find((e) => e.id === editingId);
    const dateToSave = existing?.date || getTodayString();

    await db.runAsync(
      'UPDATE expenses SET amount = ?, category = ?, note = ?, date = ? WHERE id = ?;',
      [amountNumber, trimmedCategory, trimmedNote || null, dateToSave, editingId]
    );

    setEditingId(null);
    setAmount('');
    setCategory('');
    setNote('');

    loadExpenses();
  };

  // Decide whether to add or update
  const handleSavePress = async () => {
    if (editingId === null) {
      await addExpense();
    } else {
      await updateExpense();
    }
  };

  // Delete an expense
  const deleteExpense = async (id) => {
    await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
    loadExpenses();
  };

  // Start editing a row
  const startEditExpense = (expense) => {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setNote(expense.note || '');
  };

  // Filter expenses based on chosen filter
  const filteredExpenses = useMemo(() => {
    if (filter === 'WEEK') {
      return expenses.filter((e) => isThisWeek(e.date));
    }
    if (filter === 'MONTH') {
      return expenses.filter((e) => isThisMonth(e.date));
    }
    return expenses; // ALL
  }, [expenses, filter]);

  // Total spending for current filter
  const totalSpending = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );
  }, [filteredExpenses]);

  // Totals by category for current filter
  const categoryTotals = useMemo(() => {
    const totals = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      const value = Number(e.amount || 0);
      if (!totals[cat]) totals[cat] = 0;
      totals[cat] += value;
    });
    return totals;
  }, [filteredExpenses]);

  // Initial setup: create table, try to add date column, then load data
  useEffect(() => {
    async function setup() {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT,
          date TEXT
        );
      `);

      // Try to add "date" column in case the table was created without it
      try {
        await db.execAsync('ALTER TABLE expenses ADD COLUMN date TEXT;');
      } catch (e) {
        // ignore if it already exists
      }

      await loadExpenses();
    }

    setup();
  }, []);

  const renderExpense = ({ item }) => (
    <TouchableOpacity
      style={styles.expenseRow}
      onPress={() => startEditExpense(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseAmount}>
          ${Number(item.amount).toFixed(2)}
        </Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
        {item.date ? (
          <Text style={styles.expenseDate}>Date: {item.date}</Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={() => deleteExpense(item.id)}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Expense Tracker</Text>

      {/* Filters */}
      <View style={styles.filterRow}>
        <Button title="All" onPress={() => setFilter('ALL')} />
        <Button title="This Week" onPress={() => setFilter('WEEK')} />
        <Button title="This Month" onPress={() => setFilter('MONTH')} />
      </View>

      {/* Totals */}
      <View style={styles.totalsBox}>
        <Text style={styles.totalTitle}>Total Spending:</Text>
        <Text style={styles.totalNumber}>
          ${totalSpending.toFixed(2)}
        </Text>

        <Text style={styles.totalTitle}>By Category:</Text>
        {Object.keys(categoryTotals).length === 0 ? (
          <Text style={styles.totalItem}>No expenses for this filter.</Text>
        ) : (
          Object.entries(categoryTotals).map(([cat, amt]) => (
            <Text key={cat} style={styles.totalItem}>
              {cat}: ${amt.toFixed(2)}
            </Text>
          ))
        )}
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g. 12.50)"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Category (Food, Books, Rent...)"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#9ca3af"
          value={note}
          onChangeText={setNote}
        />
        <Button
          title={editingId === null ? 'Add Expense' : 'Save Changes'}
          onPress={handleSavePress}
        />
        {editingId !== null && (
          <View style={{ marginTop: 8 }}>
            <Button
              title="Cancel Edit"
              color="#9ca3af"
              onPress={() => {
                setEditingId(null);
                setAmount('');
                setCategory('');
                setNote('');
              }}
            />
          </View>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpense}
        ListEmptyComponent={
          <Text style={styles.empty}>No expenses yet for this filter.</Text>
        }
      />

      <Text style={styles.footer}>
        Enter your expenses and they’ll be saved locally with SQLite.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalsBox: {
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 6,
  },
  totalNumber: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalItem: {
    color: '#e5e7eb',
    fontSize: 13,
  },
  form: {
    marginBottom: 16,
    gap: 8,
  },
  input: {
    padding: 10,
    backgroundColor: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  expenseNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expenseDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  delete: {
    color: '#f87171',
    fontSize: 20,
    marginLeft: 12,
  },
  empty: {
    color: '#9ca3af',
    marginTop: 24,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 12,
    fontSize: 12,
  },
});
