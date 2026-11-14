"""Which indicator comes from which source, with plausibility checks.

`licence_cleared` is the licence gate (CLAUDE.md, "Licence-cleared sources only"):
only sources whose terms were read and recorded in DECISIONS.md may be fetched.
Indicators not listed here, or not cleared, keep their mock data.

This table maps one-to-one onto the post-MVP config/indicators.yaml.
"""

WB = "world_bank"

INDICATORS = {
    # --- Economy ---
    "gdp_growth_advanced": dict(source=WB, licence_cleared=True,
                                params=dict(code="NY.GDP.MKTP.KD.ZG", country="HIC"),
                                checks=dict(min=-15, max=20)),
    "gdp_growth_developing": dict(source=WB, licence_cleared=True,
                                  params=dict(code="NY.GDP.MKTP.KD.ZG", country="LMY"),
                                  checks=dict(min=-15, max=20)),
    "eur_usd": dict(source="frankfurter", licence_cleared=True,
                    params=dict(quote="USD"), window_days=730, checks=dict(min=0.5, max=2.0)),
    "usd_cny": dict(source="frankfurter", licence_cleared=True,
                    params=dict(quote="USD/CNY"), window_days=730, checks=dict(min=4, max=10)),
    # CoinGecko's API terms (storage, user agreement) aren't met yet; see DECISIONS.md.
    "btc_usd": dict(source="coingecko", licence_cleared=False),
    # --- Climate ---
    "temp_anomaly": dict(source="copernicus", licence_cleared=True,
                         params=dict(offset_to_1850_1900=0.88), window_days=730,
                         checks=dict(min=-1, max=3)),
    "co2_ppm": dict(source="noaa_gml", licence_cleared=True, window_days=730,
                    checks=dict(min=380, max=480)),
    # --- Health, living standards, stability, demography ---
    "child_mortality": dict(source=WB, licence_cleared=True,
                            params=dict(code="SH.DYN.MORT", country="WLD"),
                            checks=dict(min=1, max=300)),
    "life_expectancy": dict(source=WB, licence_cleared=True,
                            params=dict(code="SP.DYN.LE00.IN", country="WLD"),
                            checks=dict(min=20, max=100)),
    "drinking_water": dict(source=WB, licence_cleared=True,
                           params=dict(code="SH.H2O.SMDW.ZS", country="WLD"),
                           checks=dict(min=0, max=100)),
    "conflict_deaths": dict(source="owid", licence_cleared=True,
                            params=dict(slug="deaths-in-state-based-conflicts-by-region", entity="World"),
                            checks=dict(min=0, max=2_000_000)),
    "population": dict(source=WB, licence_cleared=True,
                       params=dict(code="SP.POP.TOTL", country="WLD"), scale=1e-9,
                       checks=dict(min=1, max=20)),
    "fertility": dict(source=WB, licence_cleared=True,
                      params=dict(code="SP.DYN.TFRT.IN", country="WLD"),
                      checks=dict(min=0.5, max=10)),
}
