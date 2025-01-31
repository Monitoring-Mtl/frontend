"use client";

import { useLayout } from "@/contexts/LayoutContext";
import { ServerlessApiService } from "@/services/ServerlessApiService";
import { Direction } from "@/types/Direction";
import { RouteShape } from "@/types/RouteShape";
import { StmAnalysis } from "@/types/StmAnalysis";
import { Stop } from "@/types/Stop";
import { toEpoch } from "@/utils/datetime-utils";
import { Card } from "@mui/material";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ControlsForm from "../../layouts/ControlsForm";
import Row from "../../layouts/Row";
import { AccessRampChart } from "../graphs/AccessRampChart";
import { BusPunctualityChart } from "../graphs/BusPunctualityChart";
import { BusSegmentsPunctualityOffset } from "../graphs/BusSegmentsPunctualityOffset";
import { OccupancyChart } from "../graphs/OccupancyChart";
import { StmMap } from "../map/StmMap";

export default function StmDashboard() {
  const [stmAnalysis, setStmAnalysis] = useState<StmAnalysis>();
  const [routeShape, setRouteShape] = useState<RouteShape>();
  const [stops, setStops] = useState<Stop[]>([]);
  const [formContext, setFormContext] = useState<any>();
  const { serviceTabValue } = useLayout();

  const directionCallback = (direction: Direction) => {
    ServerlessApiService.getShape(direction.shapeId).then((shape) => {
      if (shape) {
        setRouteShape(shape);
      }
      setStops(direction.stops);
    });
  };

  const stopSelectionCallback = (stopId: string) => {
    formContext?.setFieldValue("stopId", Number(stopId));
  };

  const contextCallback = (context) => {
    if (!formContext) {
      setFormContext(context);
    }
  };

  const stmAnalysisCallback = (
    routeId: string,
    stopId: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ) => {
    const start = toEpoch(startDate, startTime).toString();
    const end = toEpoch(endDate, endTime).toString();

    ServerlessApiService.getStmAnalysis(routeId, stopId, start, end).then(
      (stmAnalysis) => {
        if (stmAnalysis) {
          setStmAnalysis(stmAnalysis);
        } else {
          toast.error(
            "Il n'y a pas de données disponibles pour cet arrêt durant cette période."
          );
        }
      }
    );
  };

  return (
    serviceTabValue === 0 && (
      <div data-testid="stm-dashboard">
        <Row>
          <Card className="col-span-9 h-100 pt-0">
            <StmMap
              routeShape={routeShape}
              stops={stops}
              stopCallback={stopSelectionCallback}
            />
          </Card>

          <Card
            id="bus-line-form"
            className="col-span-3 min-h-[676px]"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <ControlsForm
              directionCallback={directionCallback}
              stmAnalysisCallback={stmAnalysisCallback}
              contextCallback={contextCallback}
            />
          </Card>
        </Row>

        {stmAnalysis && (
          <Row>
            <Card className="col-span-4">
              <AccessRampChart analysis={stmAnalysis} />
            </Card>

            <Card className="col-span-4">
              <OccupancyChart analysis={stmAnalysis} />
            </Card>

            <Card className="col-span-4">
              <BusPunctualityChart analysis={stmAnalysis} />
            </Card>
          </Row>
        )}
        {stmAnalysis && (
          <Row>
            <Card className="col-span-12">
              <BusSegmentsPunctualityOffset
                analysis={stmAnalysis}
                stops={stops}
              />
            </Card>
          </Row>
        )}

        <Row>
          {/* Dernière ligne vide qui réutilise le même padding que les rows précédentes. Si jamais on change le padding des rows, ceci va changer aussi. */}
          <></>
        </Row>
        <ToastContainer
          autoClose={2000}
          pauseOnFocusLoss={false}
          closeOnClick
          newestOnTop={true}
          pauseOnHover={true}
          icon={true}
        />
      </div>
    )
  );
}
