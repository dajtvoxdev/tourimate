using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class DivisionsHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("36b792a9-ebad-4a48-a4b5-e8796b678317"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8ceea59f-e4ef-48dc-8dc2-4391e00016b4"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("a213d130-5554-4b43-ac2f-1c57b8059b8c"));

            migrationBuilder.AddColumn<int>(
                name: "ParentCode",
                table: "Divisions",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9119), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9120) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9127), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9127) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9133), new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9134) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("0d2474a5-d4c4-4be0-b509-bf3780dac890"), "Finance", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9624), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9624), "0.15" },
                    { new Guid("2de2d542-cb1f-48e0-9765-2ed2dbb89ed0"), "Security", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9627), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9628), "5" },
                    { new Guid("331cdded-b83b-4d76-b99d-7b8d83f65d74"), "Finance", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9619), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 6, 15, 29, 42, 323, DateTimeKind.Utc).AddTicks(9620), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Divisions_Code",
                table: "Divisions",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Divisions_Code",
                table: "Divisions");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("0d2474a5-d4c4-4be0-b509-bf3780dac890"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("2de2d542-cb1f-48e0-9765-2ed2dbb89ed0"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("331cdded-b83b-4d76-b99d-7b8d83f65d74"));

            migrationBuilder.DropColumn(
                name: "ParentCode",
                table: "Divisions");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2167), new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2167) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2173), new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2173) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2177), new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2178) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("36b792a9-ebad-4a48-a4b5-e8796b678317"), "Security", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2505), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2505), "5" },
                    { new Guid("8ceea59f-e4ef-48dc-8dc2-4391e00016b4"), "Finance", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2485), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2485), "0.15" },
                    { new Guid("a213d130-5554-4b43-ac2f-1c57b8059b8c"), "Finance", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2489), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 10, 6, 15, 3, 3, 153, DateTimeKind.Utc).AddTicks(2489), "0.15" }
                });
        }
    }
}
