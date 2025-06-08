import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Input,
  Select,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  VStack,
  HStack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { format, subMonths } from "date-fns";
import Link from "next/link";

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

export default function Add() {
  const [buildings, setBuildings] = useState([]);
  const [selected, setSelected] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const toast = useToast();
  const months = getLast12MonthsRaw();

  // For energy entry
  const [selectedMonth, setSelectedMonth] = useState(
    months[months.length - 1].date
  );
  const [energyValue, setEnergyValue] = useState("");

  // For new building
  const [newBuilding, setNewBuilding] = useState({
    name: "",
    location: "",
    area: "",
    numberOfFloors: "",
  });
  const totalArea =
    Number(newBuilding.area) * Number(newBuilding.numberOfFloors) || "";

  useEffect(() => {
    fetch("http://localhost:4000/api/buildings")
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data);
        setLoading(false);
        if (data.length > 0) {
          const id = data[0].id || data[0]._id;
          setSelected(id);
        }
      });
  }, []);

  useEffect(() => {
    const b = buildings.find((b) => (b.id || b._id) === selected);
    setSelectedBuilding(b || null);
    if (b) {
      const m = b.monthly.find((x) => x.month === selectedMonth);
      setEnergyValue(m ? m.energy : "");
    }
  }, [selected, buildings, selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    if (selectedBuilding) {
      const m = selectedBuilding.monthly.find((x) => x.month === e.target.value);
      setEnergyValue(m ? m.energy : "");
    } else {
      setEnergyValue("");
    }
    setSuccess(false);
    setErrorMsg("");
    setInfoMsg("");
  };

  const handleEnergyChange = (val) => {
    setEnergyValue(val);
    setSuccess(false);
    setErrorMsg("");
    setInfoMsg("");
  };

  const handleEnergySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    if (!selected) {
      setErrorMsg("Please select a building to update.");
      return;
    }
    if (energyValue === "" || isNaN(Number(energyValue))) {
      setErrorMsg("Please enter a valid energy value.");
      return;
    }
    setSaving(true);
    let successFlag = false;
    try {
      const payload = {
        id: selected,
        month: selectedMonth,
        energy: Number(energyValue) || 0,
      };
      const res = await fetch("http://localhost:4000/api/buildings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Saved data", status: "success" });
        setInfoMsg("Entry saved successfully!");
        const data = await fetch("http://localhost:4000/api/buildings").then((r) =>
          r.json()
        );
        setBuildings(data);
        successFlag = true;
      } else {
        setErrorMsg("Error saving data.");
      }
    } catch (e) {
      setErrorMsg("Network error.");
    }
    setSaving(false);
    if (successFlag) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const handleAddBuilding = async () => {
    setErrorMsg("");
    setInfoMsg("");
    if (
      !newBuilding.name.trim() ||
      !newBuilding.location.trim() ||
      !newBuilding.area ||
      !newBuilding.numberOfFloors
    ) {
      setErrorMsg("Please fill all fields for the new building.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("http://localhost:4000/api/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBuilding.name.trim(),
          location: newBuilding.location.trim(),
          area: Number(newBuilding.area),
          numberOfFloors: Number(newBuilding.numberOfFloors),
        }),
      });
      if (res.ok) {
        setInfoMsg("Building added successfully!");
        setNewBuilding({ name: "", location: "", area: "", numberOfFloors: "" });
        const data = await fetch("http://localhost:4000/api/buildings").then((r) =>
          r.json()
        );
        setBuildings(data);
        setSelected(data[data.length - 1].id || data[data.length - 1]._id);
      } else {
        setErrorMsg("Error adding building.");
      }
    } catch {
      setErrorMsg("Network error.");
    }
    setSaving(false);
  };

  const handleRemoveBuilding = async () => {
    setErrorMsg("");
    setInfoMsg("");
    if (!selected || !selectedBuilding) {
      setErrorMsg("No building selected to remove.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to remove building "${selectedBuilding.name}"? This cannot be undone.`
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/buildings/${selected}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setInfoMsg("Building removed successfully!");
        const data = await fetch("http://localhost:4000/api/buildings").then((r) =>
          r.json()
        );
        setBuildings(data);
        if (data.length > 0) setSelected(data[0].id || data[0]._id);
        else setSelected("");
      } else {
        setErrorMsg("Error removing building.");
      }
    } catch {
      setErrorMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <Box
      minH="100vh"
      py={8}
      px={{ base: 2, md: 10 }}
    >
      <div className="main-header" style={{ marginTop: 0, fontSize: '2.1rem' }}>
        Add/Edit Building Energy Data
      </div>
      <div className="main-sub" style={{ marginBottom: '2.4rem', fontSize: '1rem' }}>
        Enter each building's details and energy for each month. Only last 12 months are stored.
      </div>
      <Flex direction="column" align="center" mb={8}>
        <Link href="/" passHref>
          <Button mb={2} className="site-btn" variant="unstyled">
            Back to Dashboard
          </Button>
        </Link>
      </Flex>

      <Box
        mb={6}
        className="card"
        maxW="450px"
        mx="auto"
        style={{ marginTop: 0 }}
      >
        <Heading size="sm" mb={2} color="#2563eb">
          Add a new building
        </Heading>
        <VStack spacing={3} align="stretch">
          <FormControl>
            <FormLabel>Building Name</FormLabel>
            <Input
              value={newBuilding.name}
              onChange={(e) =>
                setNewBuilding({ ...newBuilding, name: e.target.value })
              }
              placeholder="Building name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              value={newBuilding.location}
              onChange={(e) =>
                setNewBuilding({ ...newBuilding, location: e.target.value })
              }
              placeholder="Location"
            />
          </FormControl>
          <HStack>
            <FormControl>
              <FormLabel>Area (sq.ft)</FormLabel>
              <NumberInput
                min={0}
                value={newBuilding.area}
                onChange={(val) =>
                  setNewBuilding({ ...newBuilding, area: val })
                }
              >
                <NumberInputField placeholder="Area (sq.ft)" />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Number of Floors</FormLabel>
              <NumberInput
                min={1}
                value={newBuilding.numberOfFloors}
                onChange={(val) =>
                  setNewBuilding({ ...newBuilding, numberOfFloors: val })
                }
              >
                <NumberInputField placeholder="Number of Floors" />
              </NumberInput>
            </FormControl>
          </HStack>
          <FormControl>
            <FormLabel>Total Area (sq.ft)</FormLabel>
            <Input
              value={totalArea}
              readOnly
              placeholder="Total Area"
              fontWeight="bold"
            />
          </FormControl>
          <Button
            className="site-btn"
            onClick={handleAddBuilding}
            isLoading={saving}
            type="button"
            variant="unstyled"
          >
            Add
          </Button>
          {errorMsg && (
            <Alert status="error" mt={2}>
              <AlertIcon />
              {errorMsg}
            </Alert>
          )}
          {infoMsg && (
            <Alert status="success" mt={2}>
              <AlertIcon />
              {infoMsg}
            </Alert>
          )}
        </VStack>
      </Box>

      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" color="#2563eb" />
        </Flex>
      ) : (
        <Box
          className="card"
          maxW="450px"
          mx="auto"
        >
          {buildings.length === 0 && (
            <Alert status="info" mb={4}>
              <AlertIcon />
              No buildings available. Please add a building.
            </Alert>
          )}
          {buildings.length > 0 && (
            <>
              <FormControl mb={4} isRequired>
                <FormLabel fontWeight="bold" color="#2563eb">
                  Select Building
                </FormLabel>
                <Select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {buildings.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Flex mb={4} justify="flex-end">
                <Button
                  className="btn-remove"
                  size="sm"
                  onClick={handleRemoveBuilding}
                  isLoading={saving}
                  borderRadius="md"
                  fontWeight="semibold"
                  variant="unstyled"
                >
                  Remove Building
                </Button>
              </Flex>
              <form onSubmit={handleEnergySubmit}>
                <HStack align="center" mb={4}>
                  <FormControl>
                    <FormLabel>Month</FormLabel>
                    <Select
                      w="auto"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                    >
                      {months.map((m) => (
                        <option value={m.date} key={m.date}>
                          {m.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Energy (kWh)</FormLabel>
                    <NumberInput
                      min={0}
                      value={energyValue}
                      onChange={handleEnergyChange}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                  <Button
                    className="site-btn"
                    isLoading={saving}
                    type="submit"
                    alignSelf="end"
                    borderRadius="md"
                    variant="unstyled"
                  >
                    Save
                  </Button>
                </HStack>
                {errorMsg && (
                  <Alert status="error" mt={2}>
                    <AlertIcon />
                    {errorMsg}
                  </Alert>
                )}
                {infoMsg && (
                  <Alert status="success" mt={2}>
                    <AlertIcon />
                    {infoMsg}
                  </Alert>
                )}
                {success && !errorMsg && !infoMsg && (
                  <Text color="green.600" fontWeight="bold" mt={2}>
                    Saved!
                  </Text>
                )}
              </form>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}