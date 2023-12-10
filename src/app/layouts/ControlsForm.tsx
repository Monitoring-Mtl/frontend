import React, { useEffect, useState } from "react";
import { Formik, Field } from "formik";
import * as yup from "yup";
import {
  Box,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import FullButton from "../components/FullButton";
import { ServerlessApiService } from "@/services/ServerlessApiService";
import { Route } from "@/types/Route";
import { Direction } from "@/types/Direction";
import { Stop } from "@/types/Stop";

interface IControlsForm {
  directionCallback: (direction: Direction) => void;
  stmAnalysisCallback: (
    routeId: string,
    stopId: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) => void;
}

type ControlsFormFields = {
  busLine: number;
  direction: string;
  stopId: number;
  beginDate: string;
  beginTime: string;
  endDate: string;
  endTime: string;
};

const ControlsFormSchema = yup.object().shape({
  busLine: yup.number().required("Required"),
  stopId: yup.number().required("Required"),
  beginDate: yup.date().required("Required"),
  beginTime: yup.string().required("Required"),
  endDate: yup.date().required("Required"),
  endTime: yup.string().required("Required"),
  direction: yup.string().required("Required"),
});

export default function ControlsForm({
  directionCallback,
  stmAnalysisCallback,
}: IControlsForm) {
  const [formInitialValues] = useState<ControlsFormFields>({
    busLine: -1,
    direction: "",
    stopId: -1,
    beginDate: "",
    beginTime: "",
    endDate: "",
    endTime: "",
  });

  const [routes, setRoutes] = useState<Route[]>([]);
  const [directions, setDirections] = useState<Direction[] | null>([]);
  const [stops, setStops] = useState<Stop[] | null>([]);
  const [routeError, setRouteError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await ServerlessApiService.getRoutes();
        setRoutes(r);
        if (r.length == 0) {
          setRouteError("Impossible de récupérer les routes pour le moment.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  /**
   * Filter by BusLine
   * @param id Bus line
   * @returns Json of the BusLine
   */
  const findRouteById = (id: string): Route | undefined => {
    return routes.find((route) => route.id === id);
  };

  const updateDirections = async (event) => {
    try {
      const route = findRouteById(event.target.value);
      setDirections(route?.directions || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  /**
   * Filter by Direction name
   * @param id Direction name
   * @returns Json of the Direction
   */
  const findDirectionByName = (name: string): Direction | undefined => {
    return directions?.find((direction) => direction.name === name);
  };

  const updateStops = async (event) => {
    try {
      const direction = findDirectionByName(event.target.value);
      setStops(direction?.stops || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={ControlsFormSchema}
      onSubmit={(values: ControlsFormFields) => {

        const beginDateHourMinuteString = values.beginDate + " " + values.beginTime;

        const beginDateHourMinuteDate = new Date(beginDateHourMinuteString);

        const endDateHourMinuteString = values.endDate + " " + values.endTime;
        const endDateHourMinuteDate = new Date(endDateHourMinuteString);

        if (beginDateHourMinuteDate > endDateHourMinuteDate) {
          alert("Erreur: La date-heure-minute de fin est plus petit que la date-heure-minute de début. ");
        } 
        else {
          stmAnalysisCallback(
            values.busLine.toString(),
            values.stopId.toString(),
            values.beginDate,
            values.beginTime,
            values.endDate,
            values.endTime
          );
        }
      }}
    >
      {({ submitForm, setFieldValue, values, isValid, dirty }) => (
        <>
          <div>
            <CardHeader title="Choix de la ligne et de l'arrêt" />
            <CardContent>
              {routes.length === 0 ? (
                routeError ? (
                  <div className="text-center">{routeError}</div>
                ) : (
                  <Box sx={{ display: "flex" }}>
                    <CircularProgress className="mx-auto w-full" />
                  </Box>
                )
              ) : (
                <>
                  <FormControl fullWidth>
                    <InputLabel># ligne</InputLabel>
                    <Select
                      value={values["busLine"]}
                      label="# ligne"
                      onChange={(e) => {
                        setFieldValue("busLine", e.target.value);
                        updateDirections(e);
                      }}
                    >
                      {routes.map((route) => (
                        <MenuItem key={route.id} value={route.id}>
                          {route.id} {route.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={values["direction"]}
                      label="Direction"
                      onChange={(e) => {
                        setFieldValue("direction", e.target.value);
                        updateStops(e);
                        const direction = findDirectionByName(e.target.value);
                        if (direction) {
                          directionCallback(direction);
                        }
                      }}
                    >
                      {directions?.map((direction) => (
                        <MenuItem key={direction.name} value={direction.name}>
                          {direction.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel># arrêt</InputLabel>
                    <Select
                      value={values["stopId"]}
                      label="# arrêt"
                      onChange={(e) => setFieldValue("stopId", e.target.value)}
                    >
                      {stops &&
                        stops.map((stop) => (
                          <MenuItem key={stop.id} value={stop.id}>
                            {stop.id} {stop.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <Field
                    component={TextField}
                    fullWidth
                    name="beginDate"
                    label="Date de début"
                    type="date"
                    onChange={(e) => setFieldValue("beginDate", e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

                  <Field
                    component={TextField}
                    fullWidth
                    name="beginTime"
                    label="Heure de début"
                    type="time"
                    onChange={(e) => setFieldValue("beginTime", e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

                  <Field
                    component={TextField}
                    fullWidth
                    name="endDate"
                    label="Date de fin"
                    type="date"
                    onChange={(e) => setFieldValue("endDate", e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

                  <Field
                    component={TextField}
                    fullWidth
                    name="endTime"
                    label="Heure de fin"
                    type="time"
                    onChange={(e) => setFieldValue("endTime", e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </>
              )}
            </CardContent>
          </div>
          <FullButton 
            isDisabled={!(isValid && dirty)} // Disable button when form is invalid or not dirty
            onClick={() => submitForm()}
          >
            Analyser
          </FullButton>        </>
      )}
    </Formik>
  );
}
