using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace tourimate.Migrations
{
    /// <inheritdoc />
    public partial class AddDivisions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('[dbo].[Users]')) DROP INDEX [IX_Users_Email] ON [dbo].[Users];");

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("5729e17f-ff0a-4ebf-811d-9f44765a163a"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("8a3d5ef3-672a-4642-af4e-4cf6a47bd15b"));

            migrationBuilder.DeleteData(
                table: "SystemSettings",
                keyColumn: "Id",
                keyValue: new Guid("f080e03c-b5eb-475d-8381-4fb82ac5f01f"));

            migrationBuilder.AddColumn<int>(
                name: "DivisionCode",
                table: "Tours",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Divisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NameEn = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CodeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Divisions", x => x.Id);
                    table.UniqueConstraint("AK_Divisions_Code", x => x.Code);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_DivisionCode_IsActive",
                table: "Tours",
                columns: new[] { "DivisionCode", "IsActive" });

            migrationBuilder.AddForeignKey(
                name: "FK_Tours_Divisions_DivisionCode",
                table: "Tours",
                column: "DivisionCode",
                principalTable: "Divisions",
                principalColumn: "Code",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tours_Divisions_DivisionCode",
                table: "Tours");

            migrationBuilder.DropTable(
                name: "Divisions");

            migrationBuilder.Sql(
                "IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('[dbo].[Users]')) DROP INDEX [IX_Users_Email] ON [dbo].[Users];");

            migrationBuilder.DropIndex(
                name: "IX_Tours_DivisionCode_IsActive",
                table: "Tours");

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

            migrationBuilder.DropColumn(
                name: "DivisionCode",
                table: "Tours");

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7565), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7566) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7571), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7572) });

            migrationBuilder.UpdateData(
                table: "ProductCategories",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7575), new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(7575) });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Id", "Category", "CreatedAt", "DeletedAt", "Description", "IsDeleted", "IsPublic", "Key", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { new Guid("5729e17f-ff0a-4ebf-811d-9f44765a163a"), "Finance", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8444), null, "Commission rate for tour bookings", false, true, "CommissionRate_Tours", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8445), "0.15" },
                    { new Guid("8a3d5ef3-672a-4642-af4e-4cf6a47bd15b"), "Security", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8453), null, "OTP expiry time in minutes", false, false, "OTP_ExpiryMinutes", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8453), "5" },
                    { new Guid("f080e03c-b5eb-475d-8381-4fb82ac5f01f"), "Finance", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8449), null, "Commission rate for product sales", false, true, "CommissionRate_Products", new DateTime(2025, 9, 30, 2, 43, 52, 685, DateTimeKind.Utc).AddTicks(8450), "0.15" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }
    }
}
