_sequence(async api => {
    await api._click("header a");

    assertTabs(2, "External link did not open");
});