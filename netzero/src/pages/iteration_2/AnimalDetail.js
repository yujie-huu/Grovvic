// src/pages/iteration_2/AnimalDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./AnimalDetail.css";

const AnimalDetail = () => {
  const { name } = useParams(); // 从 URL 获取物种名
  const [animal, setAnimal] = useState(null);

  useEffect(() => {
    if (!name) return;
    const url = `https://netzero-vigrow-api.duckdns.org/iter2/species/animal/${encodeURIComponent(
      name
    )}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimal(data))
      .catch((err) => console.error("Error fetching animal detail:", err));
  }, [name]);

  if (!animal) return <p>Loading...</p>;

  return (
    <div className="animal-detail">
      <h1>{animal.vernacular_name || animal.animal_taxon_name}</h1>
      <img
        src={animal.image_url}
        alt={animal.animal_taxon_name}
        className="animal-detail-img"
      />
      <p><b>Scientific name:</b> <i>{animal.animal_taxon_name}</i></p>
      <p><b>Kingdom:</b> {animal.kingdom}</p>
      <p><b>Phylum:</b> {animal.phylum}</p>
      <p><b>Class:</b> {animal.class_}</p>
      <p><b>Order:</b> {animal.order_}</p>
      <p><b>Family:</b> {animal.family}</p>
      <p><b>Genus:</b> {animal.genus}</p>
      <p><b>Records:</b> {animal.number_of_records}</p>
      <p><b>Summary:</b> {animal.summary}</p>
    </div>
  );
};

export default AnimalDetail;
