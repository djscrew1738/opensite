from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, conint, constr


class Coordinates(BaseModel):
    x: conint(ge=0)
    y: conint(ge=0)


class PlumbingFixture(BaseModel):
    type: constr(pattern=r'^(sink|toilet|urinal|shower|bathtub|water_heater|pipe_fitting)$')
    count: conint(ge=1, le=1000) = 1
    location_coords: Optional[List[Coordinates]] = None
    notes: Optional[str] = None
    material: Optional[str] = None


class MaterialSpec(BaseModel):
    name: constr(min_length=3)
    material_type: constr(min_length=3)
    quantity: conint(ge=1)
    unit: constr(min_length=1) = "pcs"
    notes: Optional[str] = None


class PlumbingExtraction(BaseModel):
    fixtures: List[PlumbingFixture] = []
    materials: List[MaterialSpec] = []
    notes: Optional[str] = None
    project_name: Optional[str] = None
    confidence: Optional[float] = None

    class Config:
        extra = "forbid"
