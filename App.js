import React, { Component, useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import * as SQLite from "expo-sqlite";

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSQL: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

function History({}) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "select id, date(date) as date, weight, height, BMI from history order by date desc;",
        [],
        (_, { rows: { _array } }) => setHistory(_array)
      );
    });
  }, []);

  if (history === null || history.length === 0) {
    return null;
  }

  return (
    <ScrollView>
      <Text style={styles.historyTitle}>BMI History</Text>
      {history.map(({ id, date, weight, height, BMI }) => (
        <Text style={styles.history} key={id}>
          {date}: {BMI} (W:{weight}, H:{height})
        </Text>
      ))}
    </ScrollView>
  );
}

function ListHistory(){
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  return(
  <ScrollView>
    <History key={`forceupdate-todo=${forceUpdateId}`} />
  </ScrollView>
  );
}

export default class App extends Component {
  state = {
    BMI: "",
    weight: "",
    height: "",
  };

  constructor(props) {
    super(props);
  }

  calculateBMI = async () => {
    const { height, weight } = this.state;
    const BMI = ((weight / (height * height)) * 703).toFixed(1);
    this.setState({ BMI });
    db.transaction((tx) => {
      //tx.executeSql("drop table history;");
      tx.executeSql(
        "create table if not exists history (id integer primary key not null, date real, weight double, height double, BMI double);"
      );
      tx.executeSql(
        "insert into history (date, weight, height, BMI) values (julianday('now'), ?, ?, ?)",
        [weight, height, BMI]
      );
      tx.executeSql("select * from history", [], (_, { rows }) =>
        console.log(JSON.stringify(rows))
      );
    },
    null,);
  };

  onChangeWeight = (weight) => {
    this.setState({ weight });
  };
  onChangeHeight = (height) => {
    this.setState({ height });
  };

  render() {
    const { BMI, weight, height } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            onChangeText={this.onChangeWeight}
            value={weight}
            placeholder="Weight in Pounds"
          />
          <TextInput
            style={styles.input}
            onChangeText={this.onChangeHeight}
            value={height}
            placeholder="Height in inches"
          />
          <Pressable onPress={this.calculateBMI}>
            <Text style={styles.button}>Compute BMI</Text>
          </Pressable>
          <ScrollView style={styles.BMIContainer} contentContainerStyle={{justifyContent: 'center'}}>
          <TextInput
            style={styles.BMI}
            value={BMI ? "Body Mass Index is " + BMI : ""}
            editable={false}
          />
          <TextInput
            style={styles.healthy}
            value={
              BMI ?
              (BMI < 25 ? 
              (BMI < 18.5 ? "(Underweight)" : "(Healthy)") 
              : (BMI < 30 ? "(Overweight)" : "(Obese)"))
              : "" }
            editable={false}
          />
          </ScrollView>
          {Platform.OS === "web" ? (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center",}}>
              <Text style={styles.heading}>
                Expo SQlite is not supported on web!
              </Text>
            </View>
          ) : (
            <ListHistory/>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  toolbar: {
    backgroundColor: "#f4511e",
    color: "#fff",
    textAlign: "center",
    padding: 20,
    fontSize: 28,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#ecf0f1",
    borderRadius: 3,
    height: 40,
    padding: 5,
    marginBottom: 10,
    flex: 1,
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  button: {
    backgroundColor: "#34495e",
    color: "#fff",
    fontSize: 24,
    padding: 10,
    borderRadius: 3,
    textAlign: "center",
  },
  BMI: {
    fontSize: 28,
    color: "#000",
  },
  healthy: {
    fontSize: 28,
    color: "#000",
    marginLeft: 80,
  },
  BMIContainer: {
    margin: 60,
    marginBottom: 0,
    width: 300,
    flex: 1,
  },
  historyTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  history: {
    fontSize: 20,
    flex: 1,
  },
});
