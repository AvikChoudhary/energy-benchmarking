import {
  Box,
  Flex,
  Heading,
  Text,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Button,
  Spinner,
  Select,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, subMonths } from "date-fns";

const COLORS = ["#2563eb", "#f59e42", "#e11d48", "#10b981", "#a21caf"];

function getLast12MonthsRaw() {
  const res = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    res.push({
      label: format(d, "MMM yy"),
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return res;
}

export default function Home() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const months = getLast12MonthsRaw();
  const [selectedTableMonth, setSelectedTableMonth] = useState(
    months[months.length - 1].date
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/api/buildings")
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data);
        setLoading(false);
      });
  }, []);

  const chartData = months.map((m, idx) => {
    const entry = { month: m.label };
    let total = 0;
    buildings.forEach((b) => {
      const val = b.monthly?.[idx]?.energy || 0;
      entry[b.name] = val;
      total += val;
    });
    entry.total = total;
    return entry;
  });

  const pieMonthIdx = months.findIndex((m) => m.date === selectedTableMonth);
  const pieData = buildings.map((b) => ({
    name: b.name,
    value: b.monthly?.[pieMonthIdx]?.energy || 0,
  }));

  const totalEnergy = buildings.reduce(
    (sum, b) =>
      sum + (b.monthly?.reduce((s, m) => s + (m.energy || 0), 0) || 0),
    0
  );

  return (
    <Box minH="100vh" px={{ base: 2, md: 8 }} py={2}>
      <div className="main-header">ENERGY SANCHAY</div>
      <div className="main-sub">THE INDEPENDENT FOUNDATION</div>
      {message && (
        <Alert status="info" mb={5}>
          <AlertIcon />
          {message}
        </Alert>
      )}
      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" color="#2563eb" />
        </Flex>
      ) : (
        <>
          <Flex
            gap={6}
            wrap="wrap"
            justify="center"
            mb={6}
            direction={{ base: "column", md: "row" }}
            align="stretch"
          >
            <Box className="card" flex="1" minW="340px" maxW="600px">
              <Heading size="md" mb={2} color="#2563eb">
                Monthly Energy Consumption
              </Heading>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={chartData}>
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  {buildings.map((b, i) => (
                    <Line
                      key={b.id || b.name}
                      type="monotone"
                      dataKey={b.name}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={3}
                      dot={false}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#222b36"
                    strokeWidth={2.2}
                    dot={false}
                    name="Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box className="card" flex="1" minW="320px" maxW="480px">
              <Heading size="md" mb={2} color="#2563eb">
                Current Month Breakdown
              </Heading>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, percent }) =>
                      percent > 0
                        ? `${name} (${(percent * 100).toFixed(1)}%)`
                        : ""
                    }
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Flex>
          <Box className="card">
            <Flex
              justify="space-between"
              align="center"
              mb={3}
              wrap="wrap"
              gap={2}
            >
              <Heading size="md" color="#2563eb">
                Building Benchmarking Table
              </Heading>
              <Flex align="center" gap={2}>
                <Text fontWeight="bold" color="#64748b">
                  Select Month:
                </Text>
                <Select
                  value={selectedTableMonth}
                  onChange={(e) => setSelectedTableMonth(e.target.value)}
                  w="153px"
                  background="#f8fafc"
                  borderColor="#e0e7ef"
                  color="#2563eb"
                  fontWeight={600}
                >
                  {months.map((m) => (
                    <option value={m.date} key={m.date}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Flex>
            </Flex>
            <Table className="table-colorful" size="sm">
              <Thead>
                <Tr>
                  <Th>BUILDING</Th>
                  <Th>LOCATION</Th>
                  <Th isNumeric>AREA</Th>
                  <Th isNumeric>FLOORS</Th>
                  <Th isNumeric>TOTAL AREA</Th>
                  <Th isNumeric>MONTHLY ENERGY</Th>
                  <Th isNumeric>TOTAL ENERGY (12MO)</Th>
                  <Th isNumeric>ENERGY SCORE</Th>
                </Tr>
              </Thead>
              <Tbody>
                {buildings.map((b, idx) => {
                  const monthIdx = months.findIndex(
                    (m) => m.date === selectedTableMonth
                  );
                  const energy = b.monthly?.[monthIdx]?.energy || 0;
                  const score =
                    energy > 0 ? (b.totalArea / energy).toFixed(2) : "—";
                  return (
                    <Tr key={b.id || b.name}>
                      <Td style={{ fontWeight: 700, color: COLORS[idx % COLORS.length] }}>
                        {b.name}
                      </Td>
                      <Td>{b.location}</Td>
                      <Td isNumeric>{b.area}</Td>
                      <Td isNumeric>{b.numberOfFloors}</Td>
                      <Td isNumeric>{b.totalArea}</Td>
                      <Td isNumeric>{energy}</Td>
                      <Td isNumeric>
                        {b.monthly?.reduce(
                          (s, m) => s + (m.energy || 0),
                          0
                        ) || 0}
                      </Td>
                      <Td isNumeric style={{ color: "#2563eb", fontWeight: 800 }}>
                        {score}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            <Flex mt={5} justify="flex-end" gap={3}>
              <Link href="/add" passHref legacyBehavior>
                <Button className="site-btn" variant="unstyled">
                  Add/Update Entry
                </Button>
              </Link>
            </Flex>
          </Box>
          <Box textAlign="center" fontSize="xl" mt={10}>
            <Text color="#e11d48" fontWeight="bold">
              Total Energy Consumption:{" "}
              {totalEnergy.toLocaleString()} kWh
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}
