import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api.js";
import { Banner, Button, Card, Field, Input, PageHeader, Spinner } from "../../components/ui/index.jsx";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ shopName: "", ownerName: "", phone: "", address: "" });
  const [, setLocation] = useState({ location: null, deliveryRadius: 5 });
  const [coords, setCoords] = useState({ latitude: "", longitude: "" });
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    Promise.all([apiRequest("/api/chemist/profile"), apiRequest("/api/chemist/location")])
      .then(([profileRes, locationRes]) => {
        const chemist = profileRes.data;
        setForm({ shopName: chemist.shopName || "", ownerName: chemist.ownerName || "", phone: chemist.phone || "", address: chemist.address || "" });
        setLocation(locationRes.data);
        setRadius(locationRes.data.deliveryRadius ?? 5);
        const [lng, lat] = locationRes.data.location?.coordinates || [];
        setCoords({ latitude: lat ?? "", longitude: lng ?? "" });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true); setBanner(null);
    try {
      const res = await apiRequest("/api/chemist/profile", { method: "PUT", body: form });
      localStorage.setItem("chemist_account", JSON.stringify({ ...JSON.parse(localStorage.getItem("chemist_account") || "{}"), ...res.data }));
      setBanner({ type: "success", message: "Profile updated." });
    } catch (err) { setBanner({ type: "error", message: err.message }); }
    finally { setSaving(false); }
  }

  async function saveLocation(e) {
    e.preventDefault();
    setSaving(true); setBanner(null);
    try {
      const res = await apiRequest("/api/chemist/location", {
        method: "PUT",
        body: { latitude: Number(coords.latitude), longitude: Number(coords.longitude) },
      });
      setLocation(res.data);
      setBanner({ type: "success", message: "Location updated." });
    } catch (err) { setBanner({ type: "error", message: err.message }); }
    finally { setSaving(false); }
  }

  async function saveRadius(e) {
    e.preventDefault();
    setSaving(true); setBanner(null);
    try {
      const res = await apiRequest("/api/chemist/location/radius", { method: "PUT", body: { deliveryRadius: Number(radius) } });
      setLocation(res.data);
      setBanner({ type: "success", message: "Delivery radius updated." });
    } catch (err) { setBanner({ type: "error", message: err.message }); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Profile & Settings" subtitle="Manage your pharmacy details, location and delivery radius" />
      <Banner type={banner?.type} message={banner?.message} />
      {error && <Banner message={error} />}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold mb-4">Pharmacy details</h2>
          <form onSubmit={saveProfile}>
            <Field label="Shop name"><Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required /></Field>
            <Field label="Owner name"><Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
            <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></Field>
            <Button loading={saving} type="submit">Save details</Button>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold mb-4">Location</h2>
            <form onSubmit={saveLocation}>
              <Field label="Latitude"><Input type="number" step="any" value={coords.latitude} onChange={(e) => setCoords({ ...coords, latitude: e.target.value })} required /></Field>
              <Field label="Longitude"><Input type="number" step="any" value={coords.longitude} onChange={(e) => setCoords({ ...coords, longitude: e.target.value })} required /></Field>
              <Button loading={saving} type="submit">Save location</Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold mb-4">Delivery radius</h2>
            <form onSubmit={saveRadius}>
              <Field label="Radius (km)" hint="Between 0 and 100 km"><Input type="number" min="0.1" max="100" step="any" value={radius} onChange={(e) => setRadius(e.target.value)} required /></Field>
              <Button loading={saving} type="submit">Save radius</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
